fetch("/api/news")
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("news");

    container.innerHTML = ""; // remove loading text

    data.forEach(article => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <h4>${article.title}</h4>
        <h6>Published: ${article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : ""}</h6>
        <a href="${article.url}" target="_blank">Read more →</a>
      `;

      container.appendChild(div);
    });
  })
  .catch(err => {
    console.error(err);
    document.getElementById("news").innerText = "Failed to load news.";
  });