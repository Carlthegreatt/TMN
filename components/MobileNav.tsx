"use client";

import { useRef } from "react";
import Mark from "./Mark";
import Nav from "./Nav";

// a native <dialog> gives the full-screen sheet its focus trap and Esc-to-close
export default function MobileNav({ links, children }: { links: string[][]; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button onClick={() => dialog.current?.showModal()} className="btn-ghost" aria-haspopup="dialog">Menu</button>
      <dialog ref={dialog} aria-label="Menu" className="m-0 h-full max-h-none w-full max-w-none bg-ground p-4 backdrop:bg-black/30">
        <div className="flex h-full flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-[0.9375rem] font-semibold"><Mark />TMN HR</span>
            <button onClick={() => dialog.current?.close()} className="btn-ghost">Close</button>
          </div>
          <Nav links={links} onNavigate={() => dialog.current?.close()} />
          <div className="mt-auto space-y-2">{children}</div>
        </div>
      </dialog>
    </>
  );
}
