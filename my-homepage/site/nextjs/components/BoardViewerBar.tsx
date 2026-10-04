import { signOut } from "@/app/mentor/authActions";
import type { Viewer } from "@/lib/auth/session";

// 질문 작성 영역 위의 한 줄: 로그인한 사람의 닉네임과 로그아웃.
export default function BoardViewerBar({ viewer }: { viewer: Viewer }) {
  return (
    <div className="board-bar">
      <form action={signOut} className="board-viewer">
        <span>
          <b>{viewer.nickname}</b>님{viewer.isAdmin && <span className="board-mine">관리자</span>}
        </span>
        <button type="submit" className="board-text-btn">
          로그아웃
        </button>
      </form>
    </div>
  );
}
