import type { AnchorHTMLAttributes } from "react";
import { Link, useLocation } from "react-router";
import type { LinkLikeProps } from "../../kit/components";
import { usePageStore } from "../page-store";

type RouterLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
};

/**
 * An in-app link: navigates without a page load, and starts fetching the
 * target page as soon as the pointer or focus is on it.
 */
export function RouterLink({ href, onPointerEnter, onFocus, ...rest }: RouterLinkProps) {
  const store = usePageStore();
  const { pathname } = useLocation();
  const target = href.split(/[?#]/)[0] || "/";
  const preload = () => {
    if (target !== pathname) store.preload(target);
  };
  return (
    <Link
      to={href}
      onPointerEnter={(e) => {
        preload();
        onPointerEnter?.(e);
      }}
      onFocus={(e) => {
        preload();
        onFocus?.(e);
      }}
      {...rest}
    />
  );
}

/** {@link RouterLink} in the shape kit components take as `linkComponent`. */
export function KitRouterLink({ href, ...rest }: LinkLikeProps) {
  return <RouterLink href={href} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} />;
}
