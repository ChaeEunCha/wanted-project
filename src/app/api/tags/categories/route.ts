import { NextResponse } from "next/server";
import { fetchCategoryTags } from "@/lib/wanted/client";

export async function GET() {
  try {
    const tags = await fetchCategoryTags();
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("[/api/tags/categories] failed to load category tags", error);
    return NextResponse.json(
      { error: "직군 목록을 불러오지 못했어요." },
      { status: 502 }
    );
  }
}
