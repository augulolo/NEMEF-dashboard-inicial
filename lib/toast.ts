type ToastType = "success" | "error" | "info";

export function toast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("nemef:toast", {
      detail: { message, type, id: Date.now() },
    })
  );
}
