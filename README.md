# puzzles

작고 포근한 퍼즐 게임 모음 — https://puzzles.nugo.cc

이 저장소는 **배포 전용**입니다. 각 게임의 빌드 결과물(정적 파일)을 폴더로 담아
GitHub Pages로 서빙합니다. 게임 소스는 각자 별도 저장소/폴더에 있습니다.

```
/                CNAME, index.html(허브)
/remember/       픽셀 멜로디 메모리 (소스: web-games/remember)
```

## 게임 추가하기
1. 게임 디렉터리에서 `npm run build` (Vite base는 상대경로 `./`)
2. `dist/`를 이 저장소의 `<게임이름>/`에 복사
3. `index.html` 허브에 링크 한 줄 추가
4. commit + push → 1~2분 내 https://puzzles.nugo.cc/<게임이름>/ 반영
