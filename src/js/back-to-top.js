initBackToTopButton();
document.addEventListener("DOMContentLoaded", () => {
    fetchNewsData();
});

// BACK TO TOP BUTTON
function initBackToTopButton() {
    const backToTopButton = document.getElementById("backToTop");
    let isScrolling;

    window.addEventListener("scroll", () => {
        window.clearTimeout(isScrolling);
        isScrolling = setTimeout(() => {
            if (window.scrollY > 500) {
                backToTopButton.classList.add("show");
            } else {
                backToTopButton.classList.remove("show");
            }
        }, 100);
    });

    backToTopButton.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}