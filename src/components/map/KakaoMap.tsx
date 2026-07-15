"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import type { MapMarkerData, MapMarkerKind } from "./types";

interface KakaoMapProps {
  markers: MapMarkerData[];
  /** 지도 초기 중심 좌표. 기본값: 서울 시청 */
  center?: { lat: number; lng: number };
  /** 카카오맵 확대 레벨(작을수록 확대). 기본값 7 */
  level?: number;
  className?: string;
}

/** 마감임박(D-day) 색상 구간. PRD 5-7절 DdayBadge와 동일한 기준(D-3/D-7). */
function ddayColor(dueDate?: string): string {
  if (!dueDate) return "#71717a"; // zinc-500: 마감일 정보 없음(상시채용 등)
  const due = new Date(dueDate);
  const today = new Date();
  const diffDays = Math.round(
    (Date.UTC(due.getFullYear(), due.getMonth(), due.getDate()) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) /
      (1000 * 60 * 60 * 24)
  );
  if (diffDays >= 0 && diffDays <= 3) return "#dc2626"; // red-600
  if (diffDays >= 4 && diffDays <= 7) return "#ea580c"; // orange-600
  return "#71717a"; // zinc-500
}

const KIND_COLOR: Record<MapMarkerKind, (dueDate?: string) => string> = {
  deadline: ddayColor,
  interested: () => "#b497f5", // violet-30 (브랜드 포인트)
  applied: () => "#16a34a", // green-600
};

const KIND_LABEL: Record<MapMarkerKind, string> = {
  deadline: "마감임박",
  interested: "관심 등록",
  applied: "지원함",
};

const MARKER_SIZE = 18;

/** 색상 원형 마커 이미지를 SVG data URI로 생성 (별도 아이콘 에셋 없이 카테고리별 색만 구분) */
function circleMarkerDataUri(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_SIZE}" height="${MARKER_SIZE}"><circle cx="${MARKER_SIZE / 2}" cy="${MARKER_SIZE / 2}" r="6" fill="${color}" fill-opacity="0.85"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function popupContent(marker: MapMarkerData): string {
  const label = KIND_LABEL[marker.kind];
  const due = marker.dueDate
    ? new Date(marker.dueDate).toLocaleDateString("ko-KR")
    : "상시채용";
  const skills = marker.skillTags?.length
    ? marker.skillTags.join(", ")
    : "스킬 태그 없음";
  return `
    <div style="padding:10px 12px;min-width:180px;font-size:12px;line-height:1.5;font-family:sans-serif;">
      <div style="font-weight:700;color:#635387;margin-bottom:2px;">${label}</div>
      <div style="font-weight:600;color:#18181b;">${marker.companyName}</div>
      <div style="color:#52525b;">${marker.position}</div>
      <div style="color:#71717a;margin-top:4px;">마감: ${due}</div>
      <div style="color:#71717a;">스킬: ${skills}</div>
    </div>
  `;
}

/**
 * 카카오맵 JS SDK 래퍼 컴포넌트 (P5 마감임박 지도 위젯 기반).
 *
 * 마커 데이터는 부모가 `markers` prop으로 전달한다 — 이 컴포넌트는
 * 좌표/데이터 출처를 알지 못하고 렌더링만 담당한다 (대시보드가 Wanted API
 * 상세 조회로 얻은 실제 좌표를 넘겨준다).
 */
export function KakaoMap({
  markers,
  center = { lat: 37.5665, lng: 126.978 },
  level = 7,
  className = "",
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<kakao.maps.Map | null>(null);
  const markerObjsRef = useRef<kakao.maps.Marker[]>([]);
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  useEffect(() => {
    if (!sdkLoaded || !containerRef.current) return;

    window.kakao.maps.load(() => {
      if (!containerRef.current) return;
      mapRef.current = new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level,
      });
      infoWindowRef.current = new window.kakao.maps.InfoWindow({ removable: true });
      // kakao.maps.load()의 콜백이 비동기로 끝나는 시점에야 mapRef가 채워지므로,
      // 마커를 그리는 effect는 sdkLoaded가 아니라 이 시점(mapReady)을 기준으로 트리거해야 한다.
      setMapReady(true);
    });
    // center/level 변경 시 지도를 재생성하지 않고 최초 1회만 초기화한다(마커만 갱신).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkLoaded]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    markerObjsRef.current.forEach((m) => m.setMap(null));
    markerObjsRef.current = markers.map((markerData) => {
      const color = KIND_COLOR[markerData.kind](markerData.dueDate);
      const image = new window.kakao.maps.MarkerImage(
        circleMarkerDataUri(color),
        new window.kakao.maps.Size(MARKER_SIZE, MARKER_SIZE)
      );
      const marker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(markerData.lat, markerData.lng),
        map: mapRef.current!,
        image,
        title: markerData.companyName,
      });
      window.kakao.maps.event.addListener(marker, "click", () => {
        if (!infoWindowRef.current) return;
        infoWindowRef.current.setContent(popupContent(markerData));
        infoWindowRef.current.open(mapRef.current!, marker);
      });
      return marker;
    });

    // 마커가 넓게 퍼져 있어도 전부 한 화면에 들어오도록 지도 범위를 자동으로 맞춘다.
    if (markers.length > 0) {
      const bounds = new window.kakao.maps.LatLngBounds();
      markers.forEach((m) => bounds.extend(new window.kakao.maps.LatLng(m.lat, m.lng)));
      mapRef.current.setBounds(bounds);
    }
  }, [mapReady, markers]);

  if (!appKey) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-zinc-100 p-8 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 ${className}`}
      >
        NEXT_PUBLIC_KAKAO_MAP_KEY가 설정되지 않았습니다 (.env 확인 필요).
      </div>
    );
  }

  return (
    <>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => setSdkLoaded(true)}
      />
      <div
        ref={containerRef}
        className={`h-[480px] w-full rounded-xl ${className}`}
      />
    </>
  );
}
