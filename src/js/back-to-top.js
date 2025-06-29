window.addEventListener("scroll", () => {
    document.getElementById("backToTop").classList.toggle("show", window.scrollY > 500);
});
document.getElementById("backToTop").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});