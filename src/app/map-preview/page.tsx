import { KakaoMap } from "@/components/map/KakaoMap";
import { Card, CardDescription, CardTitle } from "@/components/ui/Card";
import { MOCK_MAP_MARKERS } from "@/lib/mockMapMarkers";

export default function MapPreviewPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <CardTitle>마감임박 지도 위젯 (미리보기)</CardTitle>
        <CardDescription>
          카카오맵 SDK 연동 확인용 목업 데이터입니다. 실제 공고 좌표는 P0 필터
          결과와 연동되기 전까지 목업으로 대체합니다.
        </CardDescription>
      </div>

      <Card className="flex flex-wrap gap-4 p-4 text-xs sm:p-4">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-red-600" /> 마감임박(D-3 이내)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-orange-600" /> 마감임박(D-7 이내)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-violet-30" /> 관심 등록(찜)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-green-600" /> 지원함
        </span>
      </Card>

      <KakaoMap markers={MOCK_MAP_MARKERS} />
    </div>
  );
}
