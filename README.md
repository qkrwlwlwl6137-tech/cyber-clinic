# 119 가상공간 치료 센터

도덕 수업용 웹 활동. 학생이 증상 카드를 뽑고, 원칙·이유·실천 방안을 적으면 Claude가 실시간으로
다정한 피드백(칭찬 + 보완 힌트)을 주고, 최대 3회까지 고쳐 쓴 뒤 처방전 페이지로 넘어갑니다.

**Vercel 배포 기준**으로 구성되어 있습니다. (터미널 명령어 없이, 클릭만으로 배포됩니다)

## 폴더 구조

```
cyber-clinic/
├── public/            # 학생이 보는 화면 (정적 파일)
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── cards.js        # 증상 카드 8개 데이터 (여기서 수정/추가 가능)
│   └── assets/          # 이미지들
├── api/
│   └── feedback.js     # Claude API를 호출하는 서버 함수 (API 키는 여기서만 사용됨)
└── package.json
```

API 키는 `api/feedback.js`가 서버에서만 사용하고, 학생이 보는 `public/` 폴더에는
절대 들어가지 않습니다. 그래서 키가 노출될 걱정 없이 학생들에게 링크만 공유하면 됩니다.

---

## 배포 방법 (Vercel, 무료, 터미널 불필요)

### 1. 필요한 것
- GitHub 계정
- Vercel 계정 (https://vercel.com — GitHub 계정으로 바로 가입 가능)
- Claude Console에서 발급받은 API 키

### 2. GitHub에 코드 올리기
1. GitHub에서 새 저장소(Repository)를 만듭니다.
2. 이 `cyber-clinic` 폴더 전체를 그 저장소에 업로드합니다. (웹에서 "Add file → Upload files"로
   폴더 안의 파일/폴더를 통째로 드래그해도 되고, GitHub Desktop을 써도 됩니다)
   - 이미 Cloudflare용으로 저장소를 만들어두셨다면, 같은 저장소에 그대로 덮어써서 올리셔도 됩니다.
     `wrangler.toml` 파일은 더 이상 필요 없으니 지우셔도 무방합니다 (있어도 Vercel은 무시합니다).

### 3. Vercel에서 가져오기
1. https://vercel.com 로그인 후 **"Add New... → Project"**
2. 방금 올린 GitHub 저장소 선택 → **Import**
3. 설정 화면이 뜨면 **Framework Preset**은 "Other"로 자동 선택될 거예요. 그대로 두세요.
4. **Deploy 버튼 누르기 전에** 아래 4번부터 먼저 하세요.

### 4. API 키 등록하기 (가장 중요)
1. 같은 화면(또는 배포 후 프로젝트 → **Settings → Environment Variables**)에서:
   - Key: `ANTHROPIC_API_KEY`
   - Value: Claude Console에서 발급받은 키 (`sk-ant-`로 시작)
2. 저장
3. **Deploy** 클릭 (이미 배포했다면 Deployments 탭에서 **Redeploy**)

### 5. 완료!
배포가 끝나면 `https://프로젝트이름.vercel.app` 주소가 생깁니다.
이 주소를 학생들에게 공유하면 바로 활동을 시작할 수 있습니다.

---

## 수정하고 싶을 때

- **증상 카드 추가/수정**: `public/cards.js` 파일을 열어 카드를 추가하거나 문구를 바꾸면 됩니다.
- **피드백 말투/평가 기준 수정**: `api/feedback.js` 상단의 `SYSTEM_PROMPT` 부분을 수정하면 됩니다.
- **사용 모델 변경(비용 절약)**: 같은 파일의 `model: "claude-sonnet-5"` 부분을
  `"claude-haiku-5-5"`로 바꾸면 더 저렴하게 쓸 수 있습니다.
- 수정 후 GitHub에 다시 올리면 Vercel이 자동으로 재배포합니다.

## 비용 관련 안내

- Claude Console에서 **월 사용 한도(Spend limit)**를 꼭 설정해두세요.
- 학급 규모의 사용량은 비용이 크지 않지만, 혹시 모를 과금을 막기 위한 안전장치입니다.
- Vercel 호스팅 자체는 이 정도 규모에서는 무료 범위 안에 들어갑니다.

## 학생 개인정보 관련

- 이 사이트는 학생 이름을 따로 수집하지 않습니다. 제출 내용은 학생의 기기(브라우저)에만 남고,
  서버에 저장되지 않습니다. (새로고침하면 사라집니다)
- 제출물을 선생님이 따로 모아보고 싶다면 추가 기능이 필요하니 말씀해 주세요.
