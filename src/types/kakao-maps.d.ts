/**
 * 카카오맵 JS SDK(v2)의 최소 타입 선언.
 * 공식 @types 패키지가 없어 이 프로젝트에서 실제 사용하는 API 표면만 선언한다
 * (전체 SDK를 커버하지 않음 — 새 API 사용 시 여기 추가할 것).
 */
declare namespace kakao.maps {
  class LatLng {
    constructor(lat: number, lng: number);
    getLat(): number;
    getLng(): number;
  }

  class Size {
    constructor(width: number, height: number);
  }

  class Point {
    constructor(x: number, y: number);
  }

  interface MapOptions {
    center: LatLng;
    level?: number;
  }

  class Map {
    constructor(container: HTMLElement, options: MapOptions);
    setCenter(latlng: LatLng): void;
    setLevel(level: number): void;
    getLevel(): number;
    setBounds(bounds: LatLngBounds): void;
  }

  class LatLngBounds {
    constructor();
    extend(latlng: LatLng): void;
  }

  interface MarkerImageOptions {
    offset?: Point;
  }

  class MarkerImage {
    constructor(src: string, size: Size, options?: MarkerImageOptions);
  }

  interface MarkerOptions {
    position: LatLng;
    map?: Map;
    image?: MarkerImage;
    title?: string;
  }

  class Marker {
    constructor(options: MarkerOptions);
    setMap(map: Map | null): void;
    getPosition(): LatLng;
  }

  interface InfoWindowOptions {
    content?: string | HTMLElement;
    removable?: boolean;
    zIndex?: number;
  }

  class InfoWindow {
    constructor(options?: InfoWindowOptions);
    open(map: Map, marker?: Marker): void;
    close(): void;
    setContent(content: string | HTMLElement): void;
  }

  namespace event {
    function addListener(
      target: Marker | Map,
      type: string,
      handler: (...args: unknown[]) => void
    ): void;
  }

  function load(callback: () => void): void;
}

interface Window {
  kakao: typeof kakao;
}
