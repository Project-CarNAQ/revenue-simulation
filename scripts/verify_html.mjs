async function verify() {
  const res = await fetch("http://localhost:3000");
  const html = await res.text();
  console.log("Status:", res.status);
  console.log("HTML length:", html.length);
  console.log("Has CSS reference:", html.includes(".css"));
  console.log("Has dark class:", html.includes('class="dark"'));
  console.log("Has Jakarta Sans font:", html.includes("Plus+Jakarta+Sans"));
  console.log("Has JetBrains Mono font:", html.includes("JetBrains+Mono"));
  console.log("Has CarNAQ header:", html.includes("CarNAQ"));
}

verify().catch(console.error);
