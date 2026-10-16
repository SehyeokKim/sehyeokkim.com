import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile, site } from "@/content/resume";

// 링크 미리보기 이미지 (카카오톡 · 슬랙 · 링크드인 · 메일에 주소를 붙여 넣으면 뜨는 카드). layout.tsx의 openGraph.images가 가리킨다.
// 빌드할 때 한 번 그려 out/og.png로 내보낸다. 사이트 헤더와 같은 구성: 그림 + 이름 + 직함 + 한 줄 소개
// Next 기본 규칙(opengraph-image)은 확장자 없는 파일로 내보내져 CloudFront 경로 변환 · S3 형식 추정과 맞지 않아 .png 경로를 직접 쓴다
export const dynamic = "force-static";

const size = { width: 1200, height: 630 };

// 미리보기 생성기는 woff2를 읽지 못해 Pretendard 정적 OTF를 쓴다 (사이트와 같은 글꼴)
const font = (weight: string) =>
  readFile(join(process.cwd(), `node_modules/pretendard/dist/public/static/Pretendard-${weight}.otf`));

// 색은 theme.css 라이트 테마 값 (미리보기 생성기는 CSS 변수를 읽지 못한다)
const color = { bg: "#ffffff", text: "#0b0d12", muted: "#525866", accent: "#13306e", mark: "#e3ecff" };

export async function GET() {
  const [medium, bold, extraBold, avatar] = await Promise.all([
    font("Medium"),
    font("Bold"),
    font("ExtraBold"),
    readFile(join(process.cwd(), "public/images/profile-still.png")),
  ]);
  const avatarSrc = `data:image/png;base64,${avatar.toString("base64")}`;
  // 생성기는 span마다 한 덩어리로 줄을 바꾸므로, 한 줄 소개를 단어로 쪼개 글처럼 흐르게 한다.
  // **강조** 구절은 갈라지지 않게 한 덩어리로 둔다
  const words = profile.headline
    .split("**")
    .flatMap((part, i) => (i % 2 ? [{ text: part, mark: true }] : part.split(/\s+/).filter(Boolean).map((text) => ({ text, mark: false }))));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          // 위 내용은 남은 높이의 세로 가운데, 주소 줄은 바닥 (빈칸이 한쪽에 몰리지 않게)
          padding: "40px 88px 56px",
          background: color.bg,
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", flex: 1, alignItems: "center", gap: 56 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- 미리보기 생성기 안의 img라 next/image를 쓸 수 없다 */}
          <img src={avatarSrc} width={240} height={240} alt="" />
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
              <span style={{ fontSize: 88, fontWeight: 800, color: color.text, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                {profile.name}
              </span>
              {profile.nameEn && (
                <span style={{ fontSize: 28, fontWeight: 700, color: color.muted, letterSpacing: "0.2em" }}>
                  {profile.nameEn.toUpperCase()}
                </span>
              )}
            </div>
            <span style={{ marginTop: 12, fontSize: 32, fontWeight: 700, color: color.text }}>{profile.role}</span>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                marginTop: 22,
                fontSize: 29,
                fontWeight: 500,
                color: color.muted,
                lineHeight: 1.5,
              }}
            >
              {words.map((w, i) => (
                <span
                  key={i}
                  style={
                    w.mark
                      ? {
                          marginRight: 8,
                          color: color.text,
                          fontWeight: 700,
                          backgroundImage: `linear-gradient(transparent 58%, ${color.mark} 58%)`,
                        }
                      : { marginRight: 8 }
                  }
                >
                  {w.text}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: 22,
            borderTop: `3px solid ${color.text}`,
            fontSize: 24,
            fontWeight: 700,
            color: color.accent,
          }}
        >
          <span>{site.url.replace("https://", "")}</span>
          <span style={{ color: color.muted, fontWeight: 500 }}>이력서 · 프로젝트</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Pretendard", data: medium, weight: 500, style: "normal" },
        { name: "Pretendard", data: bold, weight: 700, style: "normal" },
        { name: "Pretendard", data: extraBold, weight: 800, style: "normal" },
      ],
    },
  );
}
