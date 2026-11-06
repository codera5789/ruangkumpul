import { Children, cloneElement, isValidElement, type ReactElement } from "react";

/**
 * Slot minimalis: melempar className komponen ke anaknya.
 * Digunakan untuk pola `asChild` tanpa menambah dependensi Radix.
 */
type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactNode;
};

export function Slot({ children, className, ...props }: SlotProps) {
  const child = Children.only(children) as ReactElement<Record<string, unknown>>;

  if (!isValidElement(child)) {
    return null;
  }

  const childClass = (child.props.className as string | undefined) ?? "";
  return cloneElement(child, {
    ...props,
    ...child.props,
    className: className ? `${className} ${childClass}` : childClass,
  });
}
