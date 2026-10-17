import { useEffect, useRef, useState } from "react";
import type { User } from "../types";

type Props = {
  user: User;
  onLogout: () => void;
};

// 右上のアカウントアイコン。押すと名前・メールアドレス・ログアウトを表示する
export function AccountMenu({ user, onLogout }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // メニューの外を押したら閉じる
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const name = user.display_name || user.email || "ゲスト";

  return (
    <div className="account" ref={ref}>
      <button
        className="avatar-button"
        onClick={() => setOpen(!open)}
        aria-label="アカウントメニュー"
        aria-expanded={open}
      >
        <Avatar user={user} name={name} />
      </button>

      {open ? (
        <div className="account-menu">
          <Avatar user={user} name={name} />
          <p className="account-name">{name}</p>
          {user.email ? <p className="sub">{user.email}</p> : null}
          <button onClick={onLogout}>ログアウト</button>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ user, name }: { user: User; name: string }) {
  const [failed, setFailed] = useState(false);

  if (user.photo_url && !failed) {
    return (
      <img
        className="avatar"
        src={user.photo_url}
        alt=""
        // Google のプロフィール画像はリファラーがあると表示されないことがある
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  // 画像がなければ名前の頭文字を出す
  return <span className="avatar avatar-initial">{name.charAt(0).toUpperCase()}</span>;
}
