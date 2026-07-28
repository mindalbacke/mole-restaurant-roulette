export const metadata = {
  title: "맛집 땅굴 룰렛",
  description: "두더지가 골라주는 오늘의 맛집"
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
