/**
 * REFERENCE: Ibaliqbal/gsap-collection — slide-animation-observer
 * Source: https://github.com/Ibaliqbal/gsap-collection/tree/main/slide-animation-observer
 *
 * Key patterns to reuse:
 * - Observer.create() with onUp/onDown + isAnimating guard
 * - gsap.timeline with onComplete to release lock
 * - gsap.set() for initial positioning before timeline
 * - Direction-aware dFactor for transition direction
 */

document.addEventListener("DOMContentLoaded", () => {
  gsap.registerPlugin(Observer, SplitText, CustomEase);
  CustomEase.create("hop", "0.7, 0, 0, 1");

  let lastIndex = 0,
      isAnimating = true;

  const slides = gsap.utils.toArray(".slide"),
        totalSlide = slides.length,
        scaleSlide = 0.75,
        grayscaleSlide = "grayscale(0.7)";

  // Initial state: all slides except first are off-screen right
  gsap.set(
    slides.filter((_, index) => index !== 0),
    { xPercent: 100, scale: scaleSlide, filter: grayscaleSlide }
  );

  function goToSection(index, direction) {
    isAnimating = true;

    const isGoDown = direction === 1,
          dFactor = isGoDown ? 1 : -1;

    const timeline = gsap.timeline({
      onComplete: () => {
        lastIndex = index;
        isAnimating = false;
      },
      defaults: { duration: 1.25, ease: "power4.inOut" },
    });

    // Pre-position incoming slide
    gsap.set(slides[index], {
      scale: scaleSlide,
      filter: grayscaleSlide,
      xPercent: 100 * dFactor,
    });

    timeline
      // Slide out current
      .to(slides[lastIndex], { xPercent: -100 * dFactor, ease: "hop" })
      // Slide in new (simultaneously)
      .to(slides[index], { xPercent: 0, ease: "hop" }, "<")
      // Scale up + remove grayscale
      .to(slides[index], { scale: 1, filter: "grayscale(0)" });
  }

  // THE KEY PATTERN: Observer with isAnimating guard
  Observer.create({
    type: "wheel,touch",
    onDown: () => {
      !isAnimating && goToSection((lastIndex - 1 + totalSlide) % totalSlide, -1);
    },
    onUp: () => {
      !isAnimating && goToSection((lastIndex + 1) % totalSlide, 1);
    },
    wheelSpeed: -1,
  });
});
