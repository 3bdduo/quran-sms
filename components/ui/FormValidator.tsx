"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { validateField, validateForm, shouldValidate, type FieldEl } from "@/lib/validation";

const isField = (t: EventTarget | null): t is FieldEl =>
  t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement;

/**
 * طبقة Validation عامة لكل الحقول (موقع + لوحات التحكم):
 *  • تحقق لحظي أثناء الكتابة، وعلى الـ blur، وعند الضغط على إرسال
 *  • رسالة عربي تحت الحقل + تلوين الحقل (أحمر لو غلط / أخضر لو سليم)
 *  • لو فيه خطأ في الفورم: بيتمنع الإرسال وبيروح للحقل الغلط
 * القواعد نفسها في lib/validation.ts. مفيش أي تعديل مطلوب في الصفحات.
 */
export function FormValidator() {
  const { showToast } = useToast();
  const pathname = usePathname();

  // امسح أي رسائل قديمة عند تغيير الصفحة
  useEffect(() => {
    document.querySelectorAll(".qs-err").forEach((n) => n.remove());
  }, [pathname]);

  useEffect(() => {
    const touched = new WeakSet<FieldEl>();
    const errNodes = new WeakMap<FieldEl, HTMLElement>();
    let uid = 0;

    const sweep = () => {
      document.querySelectorAll<HTMLElement>(".qs-err[data-for]").forEach((n) => {
        const target = (n as HTMLElement & { _for?: FieldEl })._for;
        if (!target || !target.isConnected) n.remove();
      });
    };

    const clearState = (el: FieldEl) => {
      el.removeAttribute("aria-invalid");
      el.removeAttribute("data-valid");
      const node = errNodes.get(el);
      if (node) {
        node.remove();
        errNodes.delete(el);
      }
      el.removeAttribute("aria-describedby");
    };

    const show = (el: FieldEl, message: string | null) => {
      sweep();
      if (!message) {
        const had = el.getAttribute("aria-invalid") === "true";
        clearState(el);
        if (el.value.trim() !== "") el.setAttribute("data-valid", "true");
        return had;
      }
      el.setAttribute("aria-invalid", "true");
      el.removeAttribute("data-valid");
      let node = errNodes.get(el);
      if (!node || !node.isConnected) {
        node = document.createElement("p");
        node.className = "qs-err";
        node.setAttribute("role", "alert");
        node.id = `qs-err-${++uid}`;
        node.setAttribute("data-for", node.id);
        (node as HTMLElement & { _for?: FieldEl })._for = el;
        el.insertAdjacentElement("afterend", node);
        errNodes.set(el, node);
        el.setAttribute("aria-describedby", node.id);
      }
      if (node.textContent !== message) node.textContent = message;
      return true;
    };

    // أثناء الكتابة / تغيير الاختيار
    const onInput = (e: Event) => {
      const el = e.target;
      if (!isField(el) || !shouldValidate(el)) return;
      touched.add(el);
      show(el, validateField(el));
    };

    // عند الخروج من الحقل
    const onBlur = (e: FocusEvent) => {
      const el = e.target;
      if (!isField(el) || !shouldValidate(el)) return;
      if (!touched.has(el) && el.value.trim() === "") return; // ما نزعجش حد بس عدّى بالتاب
      touched.add(el);
      show(el, validateField(el));
    };

    // منع رسائل المتصفح الإنجليزي (بنستخدم رسائلنا)
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target;
      if (isField(el) && el.form) el.form.noValidate = true;
    };
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element | null)?.closest?.("button, input[type=submit]") as HTMLButtonElement | null;
      if (btn?.form && btn.type === "submit") btn.form.noValidate = true;
    };

    // عند الإرسال
    const onSubmit = (e: Event) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement) || form.hasAttribute("data-vskip")) return;

      const errors = validateForm(form);
      form.querySelectorAll<FieldEl>("input, textarea, select").forEach((el) => {
        if (!shouldValidate(el)) return;
        touched.add(el);
        const err = errors.find((x) => x.el === el);
        show(el, err ? err.message : null);
      });

      if (errors.length) {
        e.preventDefault();
        e.stopPropagation();
        const first = errors[0].el;
        first.scrollIntoView({ behavior: "smooth", block: "center" });
        window.setTimeout(() => first.focus({ preventScroll: true }), 350);
        showToast(
          errors.length === 1 ? errors[0].message : `في ${errors.length} حقول محتاجة تصحيح — راجع الحقول الحمراء`,
          "error",
        );
        return;
      }

      // لو الفورم اتفضّى بعد الإرسال (reset برمجي) ننضّف حالة الحقول
      [700, 2500].forEach((ms) =>
        window.setTimeout(() => {
          form.querySelectorAll<FieldEl>("input, textarea, select").forEach((el) => {
            if (el.value === "" && (el.hasAttribute("data-valid") || el.hasAttribute("aria-invalid"))) {
              touched.delete(el);
              clearState(el);
            }
          });
        }, ms),
      );
    };

    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    document.addEventListener("focusout", onBlur, true);
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
      document.removeEventListener("focusout", onBlur, true);
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
    };
  }, [showToast]);

  return null;
}
