import { neon } from "@neondatabase/serverless";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const categories = new Set(["한식", "중식", "일식", "양식", "분식", "동남아", "햄버거", "기타"]);

function getSql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  return neon(process.env.DATABASE_URL);
}

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" }
  });
}

export async function GET() {
  try {
    const sql = getSql();
    const rows = await sql`
      select id, name, category, created_at
      from restaurants
      order by created_at asc
      limit 500
    `;
    return json(rows);
  } catch (error) {
    console.error("Failed to load shared restaurants", error);
    return json({ error: "공유 맛집을 불러오지 못했습니다.", code: "DATABASE_ERROR" }, 500);
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "올바른 JSON 요청이 아닙니다.", code: "INVALID_JSON" }, 400);
  }

  const name = typeof body.name === "string" ? body.name.normalize("NFKC").trim() : "";
  const category = typeof body.category === "string" ? body.category : "";

  if (!name || [...name].length > 16) {
    return json({ error: "맛집 이름은 1~16자로 입력해 주세요.", code: "INVALID_NAME" }, 400);
  }
  if (!categories.has(category)) {
    return json({ error: "지원하지 않는 음식 분야입니다.", code: "INVALID_CATEGORY" }, 400);
  }

  try {
    const sql = getSql();
    const rows = await sql`
      insert into restaurants (name, category)
      values (${name}, ${category})
      on conflict do nothing
      returning id, name, category, created_at
    `;

    if (!rows.length) {
      return json({ error: "이미 공유 목록에 등록된 맛집입니다.", code: "DUPLICATE" }, 409);
    }
    return json(rows[0], 201);
  } catch (error) {
    console.error("Failed to add shared restaurant", error);
    return json({ error: "공유 맛집을 저장하지 못했습니다.", code: "DATABASE_ERROR" }, 500);
  }
}
