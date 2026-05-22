export function ratindDisplayAnimation() {
  const runAnimation = () => {

    const animationStepValue = parsedDisplayValue / animation_ms;

    let fpsInterval = animation_ms / animation_fps,
      currentDisplayValue = displayScaleStartValue, // valore iniziale. La scala parte da 1
      startTimestamp = Date.now(),
      animationEnd = false;

    const step = () => {
      let now = Date.now(),
        elapsed = now - startTimestamp;

      currentDisplayValue = Math.min(currentDisplayValue, parsedDisplayValue);

      if(currentDisplayValue >= parsedDisplayValue) {
        animationEnd = true;
      }

      // request another frame
      const animationRequest = window.requestAnimationFrame(step);

      // if enough time has elapsed, draw the next frame
      if (elapsed >= fpsInterval) {

        // Get ready for next frame by setting startTimestamp=now, but...
        // Also, adjust for fpsInterval not being multiple of 16.67
        startTimestamp = now - (elapsed % fpsInterval);

        svgElement.style.setProperty(
          '--rd-rot',
          Math.max(0, ((currentDisplayValue - displayScaleStartValue) * 240) / (scale - .001))
        );

        if(animationEnd) {
          window.cancelAnimationFrame(animationRequest);

        } else {
          currentDisplayValue += animationStepValue;
          // easing out a 2/3 del valore
          // if(currentDisplayValue >= parsedDisplayValue * 2/3) {
          //   fpsInterval += 1;
          // }

        }
      }

    };// end step

    step();
  }; // end animazione_arco

  runAnimation();

}; // end display_animation
