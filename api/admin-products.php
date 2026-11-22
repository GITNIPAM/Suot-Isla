<?php
declare(strict_types=1);
require_once __DIR__ . '/shop.php';

shop(function (PDO $db, array $user, array $data, string $method): array {
    if ($method === 'GET') {
        return [
            'categories' => query($db, 'SELECT category_id, name, slug, is_archived FROM categories ORDER BY name')->fetchAll(PDO::FETCH_ASSOC),
            'series' => query($db, 'SELECT series_id, name FROM island_series ORDER BY name')->fetchAll(PDO::FETCH_ASSOC),
            'products' => query($db, 'SELECT p.*, v.variant_id, v.variant_sku, v.size_label, v.color_name, v.stock_qty, v.is_archived AS variant_archived
            FROM products p LEFT JOIN product_variants v ON v.product_id = p.product_id
            ORDER BY p.name, v.variant_id')->fetchAll(PDO::FETCH_ASSOC)];
    }

    $action = $data['action'] ?? '';
    if ($action === 'toggle_category' || $action === 'toggle_variant') {
        $archived = whole($data, 'archived', 0, 1);
        if ($action === 'toggle_category') {
            query($db, 'UPDATE categories SET is_archived = ? WHERE category_id = ?',
                [$archived, whole($data, 'category_id')]);
        } else {
            query($db, 'UPDATE product_variants SET is_archived = ? WHERE variant_id = ?',
                [$archived, whole($data, 'variant_id')]);
        }
        return ['archived' => (bool) $archived];
    }
    if ($action === 'remove_image') {
        query($db, 'UPDATE products SET image_url = NULL WHERE product_id = ?', [whole($data, 'product_id')]);
        return ['message' => 'Product photo removed.'];
    }
    if ($action === 'save_category') {
        $name = field($data, 'name', 100);
        $slug = field($data, 'slug', 100);
        if (!preg_match('/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/', $slug)) {
            fail(422, 'Use lowercase words separated by hyphens for the category slug.');
        }
        if (empty($data['category_id'])) {
            query($db, 'INSERT INTO categories (name, slug) VALUES (?, ?)', [$name, $slug]);
        } else {
            query($db, 'UPDATE categories SET name = ?, slug = ? WHERE category_id = ?',
                [$name, $slug, whole($data, 'category_id')]);
        }
        return ['message' => 'Category saved.'];
    }
    if ($action === 'edit_variant') {
        $variant = whole($data, 'variant_id');
        query($db, 'UPDATE product_variants SET size_label = ?, color_name = ?, stock_qty = ? WHERE variant_id = ?',
            [field($data, 'size_label', 40), field($data, 'color_name', 60), whole($data, 'stock_qty', 0, 100000), $variant]);
        return ['variant_id' => $variant];
    }
    if ($action === 'adjust_stock') {
        $variant = whole($data, 'variant_id');
        $delta = whole($data, 'delta', -1, 10);
        if (!in_array($delta, [-1, 1, 10], true)) {
            fail(422, 'Choose a valid stock adjustment.');
        }
        $updated = query($db, 'UPDATE product_variants v JOIN products p ON p.product_id = v.product_id
            JOIN categories c ON c.category_id = p.category_id SET v.stock_qty = CAST(v.stock_qty AS SIGNED) + ?
            WHERE v.variant_id = ? AND NOT v.is_archived AND NOT p.is_archived AND NOT c.is_archived
            AND CAST(v.stock_qty AS SIGNED) + ? BETWEEN 0 AND 100000', [$delta, $variant, $delta])->rowCount();
        if (!$updated) {
            fail(409, 'This variant is archived or the stock adjustment is outside the allowed range.');
        }
        return ['variant_id' => $variant];
    }
    if ($action === 'restock') {
        $variant = whole($data, 'variant_id');
        $quantity = whole($data, 'quantity', 1, 100000);
        if (!query($db, 'UPDATE product_variants SET stock_qty = stock_qty + ? WHERE variant_id = ?', [$quantity, $variant])->rowCount()) {
            fail(404, 'Variant not found.');
        }
        return ['variant_id' => $variant];
    }
    if (in_array($action, ['archive', 'delete', 'restore'], true)) {
        $id = whole($data, 'product_id');
        query($db, 'UPDATE products SET is_archived = ? WHERE product_id = ?', [$action === 'restore' ? 0 : 1, $id]);
        return ['product_id' => $id, 'archived' => $action !== 'restore'];
    }
    if (!in_array($action, ['create', 'edit'], true)) {
        fail(422, 'Invalid product action.');
    }
    $sku = field($data, 'sku', 40);
    $slug = field($data, 'slug', 180);
    $name = field($data, 'name', 180);
    $price = $data['price'] ?? '';
    if (!preg_match('/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/', $slug) ||
        !is_scalar($price) || !preg_match('/\A\d{1,8}(?:\.\d{1,2})?\z/', (string) $price)) {
        fail(422, 'Enter a valid product slug and price.');
    }
    $fields = [whole($data, 'category_id'), whole($data, 'series_id'), $sku, $name, $slug,
        field($data, 'description', 5000), (string) $price];
    $file = $_FILES['image'] ?? null;
    $imagePath = null;
    if ($file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
        if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name']) ||
            $file['size'] > 5 * 1024 * 1024) {
            fail(422, 'Upload an image up to 5 MB.');
        }
        $info = @getimagesize($file['tmp_name']);
        $extension = match ($info['mime'] ?? '') {
            'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', default => null,
        };
        if (!$extension) {
            fail(422, 'Use a JPEG, PNG or WebP image.');
        }
        $imagePath = 'assets/images/products/' . bin2hex(random_bytes(16)) . '.' . $extension;
    }

    $db->beginTransaction();
    if ($action === 'create') {
        query($db, 'INSERT INTO products (category_id, series_id, sku, name, slug, description, base_price, image_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [...$fields, $imagePath]);
        $id = (int) $db->lastInsertId();
    } else {
        $id = whole($data, 'product_id');
        if (!query($db, 'SELECT 1 FROM products WHERE product_id = ? FOR UPDATE', [$id])->fetchColumn()) {
            fail(404, 'Product not found.');
        }
        query($db, 'UPDATE products SET category_id = ?, series_id = ?, sku = ?, name = ?, slug = ?,
            description = ?, base_price = ?, image_url = COALESCE(?, image_url) WHERE product_id = ?',
            [...$fields, $imagePath, $id]);
    }
    if ($action === 'create' && array_key_exists('sizes', $data) && array_key_exists('colors', $data)) {
        $options = static function (string $key, int $length) use ($data): array {
            $values = [];
            foreach (explode(',', field($data, $key, 2000)) as $part) {
                $value = trim($part);
                if ($value === '' || mb_strlen($value) > $length) {
                    fail(422, 'Enter valid comma-separated ' . $key . '.');
                }
                $values[mb_strtolower($value)] = $value;
            }
            return array_values($values);
        };
        $sizes = $options('sizes', 40);
        $colors = $options('colors', 60);
        $variantCount = count($sizes) * count($colors);
        if ($variantCount > 64) {
            fail(422, 'A product can start with up to 64 size and color combinations.');
        }
        $stock = whole($data, 'stock_qty', 0, 100000);
        $index = 0;
        foreach ($sizes as $size) {
            foreach ($colors as $color) {
                $quantity = intdiv($stock, $variantCount) + ($index < $stock % $variantCount ? 1 : 0);
                $variantSku = $sku . '-V' . str_pad((string) ++$index, 2, '0', STR_PAD_LEFT);
                query($db, 'INSERT INTO product_variants (product_id, variant_sku, size_label, color_name, stock_qty)
                    VALUES (?, ?, ?, ?, ?)', [$id, $variantSku, $size, $color, $quantity]);
            }
        }
    } elseif ($action === 'create' || textField($data, 'variant_sku') !== '') {
        query($db, 'INSERT INTO product_variants (product_id, variant_sku, size_label, color_name, stock_qty)
            VALUES (?, ?, ?, ?, ?)', [$id, field($data, 'variant_sku', 60), field($data, 'size_label', 40),
            field($data, 'color_name', 60), whole($data, 'stock_qty', 0, 100000)]);
    }
    if ($imagePath && !move_uploaded_file($file['tmp_name'], __DIR__ . '/../' . $imagePath)) {
        fail(500, 'The image could not be saved.');
    }
    try {
        $db->commit();
    } catch (Throwable $error) {
        if ($imagePath) {
            unlink(__DIR__ . '/../' . $imagePath);
        }
        throw $error;
    }
    return ['product_id' => $id];
}, ['admin', 'staff']);
