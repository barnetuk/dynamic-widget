(function(){
  const containerId = "dynamic-widget";
  let container = document.getElementById(containerId);
  if(!container){
    container = document.createElement("div");
    container.id = containerId;
    document.body.appendChild(container);
  }
  function loadForm(){
    Promise.all([
    fetch("https://book.barnettaxis.co.uk/form.min.html").then(r => {
      if(!r.ok) throw new Error(`HTML load failed (${r.status} ${r.statusText})`);
      return r.text();
    }),
    fetch("https://book.barnettaxis.co.uk/form-critical.min.css").then(r => {
      if(!r.ok) throw new Error(`CSS load failed (${r.status} ${r.statusText})`);
      return r.text();
    })
  ]).then(([html, css]) => {
    let styleTag = document.querySelector("style");
    if(!styleTag){
      styleTag = document.createElement("style");
      document.head.appendChild(styleTag);
    }
    styleTag.textContent += "\n" + css;
    container.innerHTML = html;
    let linkTag = document.createElement("link");
    linkTag.rel = "stylesheet";
    linkTag.href = "https://book.barnettaxis.co.uk/form.min.css";
    document.head.appendChild(linkTag);
    const script = document.createElement("script");
    script.src = "https://book.barnettaxis.co.uk/form.min.js";
    script.defer = true;
    document.body.appendChild(script);
  }).catch(err => {
      console.error("Form load failed:", err);
      let msg = err.message.split("(")[1].replace(")", "").trim();
      container.innerHTML = `
        <div class="formError">
          <img src="images/caution.png" alt="Failed to Load Form">
          <h2>Failed to Load Form ${msg}</h2>
          <button id="retryForm">
            Try Again
          </button>
        </div>
      `;
      document.getElementById("retryForm").onclick = loadForm;
    });
  }
  loadForm();
})();