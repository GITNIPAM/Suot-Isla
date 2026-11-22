window.loadIslandStock = async function(status) {
  const safe = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));

  async function get(endpoint, data) {
    const res = await fetch("api/" + endpoint + ".php", data ? {method:"POST",
      headers:{"Content-Type":"application/json","X-Suot-Request":"shop"},body:JSON.stringify(data)} : {cache:"no-store"});
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || "Could not load the catalog.");
    return body;
  }
  let products, customer;
  const bag = new Map();
  try {
    const [catalog, account] = await Promise.all([get("catalog"),get("account")]);
    customer = account.user?.role === "customer";
    if (customer) for (const row of (await get("checkout")).items) bag.set(Number(row.variant_id),Number(row.quantity));
    const groups = new Map();
    for (const row of catalog.variants) {
      if (!groups.has(row.slug)) {
        const editorial = window.SUOT_ISLA_DATA.products.find(p=>p.id === row.slug);
        const image = /^assets\/images\/[a-zA-Z0-9_.\/-]+$/.test(row.image_url) ? row.image_url : "";
        groups.set(row.slug,{silhouette:editorial?.silhouette,fabric:editorial?.fabric,care:editorial?.care,id:row.slug,name:row.name,series:row.series,category:row.category,
          description:row.description,sku:row.variant_sku,price:Number(row.unit_price),soldCount:0,
          image,colorImages:editorial?.image === image ? editorial.colorImages : {},badge:editorial?.badge || "",
          sizes:[],colors:[],variants:[]});
      }
      const product = groups.get(row.slug);
      if (!product.sizes.includes(row.size_label)) product.sizes.push(row.size_label);
      if (!product.colors.includes(row.color_name)) product.colors.push(row.color_name);
      product.variants.push(row);
      product.soldCount += Number(row.units_sold || 0);
      product.price = Math.min(product.price, Number(row.unit_price));
    }
    products = [...groups.values()];
  } catch(error) {
    status.textContent = error.message;
    document.getElementById("catalog-count-label")?.replaceChildren();
    return;
  }
  return {products,customer,bag,get,safe};
};
