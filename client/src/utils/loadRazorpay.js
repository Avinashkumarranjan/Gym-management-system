/**
 * Dynamically loads the Razorpay checkout script safely
 * Reuses existing script if already injected
 * @returns {Promise<boolean>} Resolves true when loaded, false if failed
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // If Razorpay is already available globally on window, resolve immediately
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }

    const scriptId = 'razorpay-checkout-script';
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;

    script.onload = () => {
      resolve(true);
    };

    script.onerror = () => {
      console.error('Failed to load Razorpay SDK script from CDN.');
      resolve(false);
    };

    document.body.appendChild(script);
  });
};
