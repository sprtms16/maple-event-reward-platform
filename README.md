
# 이벤트/보상 관리 플랫폼 (Event/Reward Management Platform)

## 1. 프로젝트 개요

본 프로젝트는 사용자 대상 이벤트를 효율적으로 생성, 관리하고 조건 달성 시 보상을 지급하는 백엔드 시스템입니다. 실제 서비스에 적용 가능한 이벤트/보상 관리 시스템을 설계하고 구현하는 것을 목표로 합니다.

운영자는 이벤트를 생성하고 보상을 설정할 수 있으며, 사용자는 조건 충족 후 보상을 요청할 수 있습니다. 요청된 보상은 운영자가 검토하거나 시스템에 의해 자동으로 지급될 수 있습니다. 또한, 감사 담당자는 지급 내역을 조회할 수 있는 권한을 가집니다.

이 시스템은 마이크로서비스 아키텍처(MSA)로 설계되어 각 기능이 독립적인 서버로 분리되어 운영됩니다.

## 2. 기술 스택

-   프로그래밍 언어: TypeScript
-   개발 환경: IntelliJ IDEA 2025.1 (Ultimate Edition) 
-   런타임 환경: Node.js (v18 고정)
-   웹 프레임워크: NestJS (최신 버전)
-   데이터베이스: MongoDB
-   인증 방식: JWT (JSON Web Tokens)
-   배포/실행 환경: Docker, Docker Compose
-   주요 NestJS 모듈:
    -   @nestjs/mongoose: MongoDB 연동
    -   @nestjs/passport, passport-jwt, @nestjs/jwt: JWT 기반 인증
    -   @nestjs/config: 환경 변수 관리
    -   class-validator, class-transformer: DTO 유효성 검사
    -   @nestjs/axios: HTTP 클라이언트 (Gateway에서 사용)


## 3. 시스템 아키텍처

-   Gateway Server (gateway-server):
    -   모든 외부 API 요청의 단일 진입점(Entry Point) 역할을 합니다.
    -   인증 (JWT 토큰 검증) 및 권한 부여 (역할 기반 접근 제어 - RBAC)를 수행합니다.
    -   요청을 적절한 내부 서비스(Auth Server, Event Server)로 라우팅(프록시)합니다.
    -   전역 예외 필터를 통해 일관된 오류 응답을 제공합니다.
-   Auth Server (auth-server):
    -   사용자 정보 관리 (회원가입, 로그인) 및 역할(Role) 관리를 담당합니다.
    -   로그인 성공 시 JWT 토큰을 발급합니다.
    -   내부적으로도 JWT를 통해 보호되는 엔드포인트(예: /auth/me)를 가질 수 있습니다.
-   Event Server (event-server):
    -   이벤트 생성, 조회, 수정, 삭제 기능을 담당합니다.
    -   이벤트에 연결된 보상(아이템, 포인트 등) 정보를 등록하고 관리합니다.
    -   사용자의 보상 요청을 접수하고, 이벤트 조건 충족 여부를 검증합니다.
    -   보상 요청 상태를 기록하고 관리하며, 보상 지급 내역을 추적합니다.
    -   사용자 활동 데이터 서비스(UserActivityService)를 통해 (현재는 목업 형태로) 이벤트 조건 검증에 필요한 데이터를 가져옵니다.


## 4. 주요 기능

### 4.1. Auth Server
-   사용자 회원가입 (POST /auth/register)
-   사용자 로그인 및 JWT 발급 (POST /auth/login)
-   인증된 사용자 정보 조회 (GET /auth/me)

### 4.2. Event Server
-   이벤트 관리 (/events):
    -   이벤트 생성, 목록/상세 조회, 수정, (소프트)삭제
    -   이벤트 조건 설정 (예: 연속 로그인, 친구 초대, 퀘스트 클리어, 최소 구매 금액 - 현재 목업 데이터 기반 검증)
-   보상 관리 (/rewards):
    -   특정 이벤트에 대한 보상 등록, 조회, 수정, 삭제
    -   보상 타입(포인트, 아이템 등), 수량, 재고 관리
-   보상 요청 관리 (/reward-requests):
    -   사용자의 보상 요청 생성 (조건 검증 포함)
    -   사용자 자신의 요청 내역 조회
    -   관리자/운영자/감사자의 전체 요청 조회 (필터링, 페이징)
    -   관리자/운영자의 요청 상태 변경 (승인, 거절, 완료 등)
    -   보상 지급 시 재고 차감 (시뮬레이션)

### 4.3. Gateway Server

-   모든 /auth/* 요청을 Auth Server로 프록시
-   모든 /events/*, /rewards/*, /reward-requests/* 요청을 Event Server로 프록시
-   요청에 대한 JWT 인증 수행
-   역할 기반 접근 제어 수행
-   Event Server로 프록시 시 인증된 사용자 정보(ID, 역할, 사용자명)를 커스텀 HTTP 헤더(X-User-ID, X-User-Roles, X-Username)로 전달


## 5. 설정 및 실행 방법

### 5.1. 사전 준비 사항

-   Node.js (v18 권장)
-   Yarn (또는 npm)
-   Docker 및 Docker Compose
-   Git

### 5.2. 프로젝트 클론
git clone <저장소_URL>

    cd event-reward-platform  

### 5.3. 환경 변수 설정

각 서비스 디렉토리(auth-server, event-server, gateway-server) 내에 있는 .env.example 파일을 복사하여 .env 파일을 생성하고, 각 환경에 맞게 내용을 수정합니다.

예시: auth-server/.env

    DATABASE_URL=mongodb://mongodb:27017/auth_db  
    JWT_SECRET=yourSuperStrongJwtSecretKeyPleaseChange # !!반드시 변경!!  
    JWT_EXPIRES_IN=1h  
    PORT=3000 # Docker 내부 포트 (docker-compose.yml에서 외부 포트와 매핑됨)  

예시: event-server/.env

    DATABASE_URL=mongodb://mongodb:27017/event_db  
    PORT=3000  

예시: gateway-server/.env

    PORT=3000 # 외부에서 접근하는 포트  
    JWT_SECRET=yourSuperStrongJwtSecretKeyPleaseChange # Auth Server와 동일한 값으로 !!반드시 변경!!  
    AUTH_SERVICE_URL=http://auth-server:3000  
    EVENT_SERVICE_URL=http://event-server:3000  
    HTTP_TIMEOUT=10000  

주의: JWT_SECRET은 모든 관련 서버(Auth, Gateway)에서 동일한 값으로 설정해야 하며, 보안을 위해 복잡하고 예측하기 어려운 문자열로 변경해야 합니다.
본 프로젝트에서는 아래 명령어 이용하였습니다

    openssl rand -hex 64

### 5.4. Docker를 이용한 전체 시스템 실행
프로젝트 루트 디렉토리(event-reward-platform/)에서 다음 명령어를 실행합니다.

    docker-compose up --build  

-   --build 옵션은 최초 실행 시 또는 Dockerfile 변경 시 이미지를 새로 빌드합니다.
-   백그라운드에서 실행하려면 -d 옵션을 추가합니다: docker-compose up --build -d
-   모든 서비스가 정상적으로 실행되면, Gateway Server의 포트(기본: http://localhost:3000)를 통해 API를 호출할 수 있습니다.


### 5.5. 개별 서버 실행 (개발 시)

각 서버 디렉토리(예: cd auth-server)로 이동하여 다음 명령어를 실행할 수 있습니다. (이 경우, docker-compose.yml을 통해 MongoDB를 별도로 실행하거나 로컬 MongoDB를 사용해야 합니다.)

    yarn install # 또는 npm install  
    yarn start:dev # 또는 npm run start:dev  


## 6. API 엔드포인트 및 테스트
API 테스트는 Postman과 같은 도구를 사용하거나, .http 파일을 VS Code의 REST Client 확장 프로그램 또는 JetBrains IDE의 HTTP Client에서 실행하여 수행할 수 있습니다.([테스트용 postman collection.json 제공](./event-reward-platform.postman_collection.json))
-   주요 엔드포인트:
    -   회원가입: POST {{gateway_url}}/auth/register
    -   로그인: POST {{gateway_url}}/auth/login
    -   내 정보 조회: GET {{gateway_url}}/auth/me (토큰 필요)
    -   이벤트 생성: POST {{gateway_url}}/events (운영자/관리자 토큰 필요)
    -   이벤트 목록 조회: GET {{gateway_url}}/events
    -   보상 요청 생성: POST {{gateway_url}}/reward-requests (일반 사용자 토큰 필요)

    
## 7. 주요 문제 해결 및 설계 결정 사항
-   Gateway Server 라우팅: 기본 경로(POST /events 등) 404 오류 해결을 위해 프록시 컨트롤러에 명시적 HTTP 메서드 핸들러와 하위 경로용 @All(':path(.*)') 핸들러를 조합하여 사용.
-   서비스 간 사용자 정보 전달: Gateway에서 인증된 사용자 정보를 커스텀 HTTP 헤더(X-User-ID, X-User-Roles, X-Username)를 통해 Event Server로 전달. Event Server의 @AuthUser 데코레이터는 이 헤더를 파싱하여 사용.
-   Event Server 조건 검증: UserActivityService를 도입하여 이벤트 조건 검증 로직을 분리. 현재는 목업 데이터 기반으로 동작하며, 실제 환경에서는 외부 데이터 소스 연동 필요. switch문 내 case 블록 스코프 문제 및 never 타입 검사를 통한 exhaustiveness check 적용.
-   전역 예외 필터: 각 서버에 HttpExceptionFilter 또는 AllExceptionsFilter를 적용하여 일관된 오류 응답 형식 제공 및 로깅.
-   ObjectId 문자열화: Mongoose ObjectId를 로깅 등 문자열로 사용할 때 .toHexString()을 명시적으로 사용하여 경고 방지 및 가독성 향상.
-   소프트 삭제: Event 스키마에 deletedAt 필드를 추가하여 데이터 복구 가능성 및 감사 추적 용이성 확보.


## 8. 향후 개선 방향
-   UserActivityService의 실제 데이터 연동 구현.
-   MongoDB 트랜잭션을 활용한 데이터 정합성 강화 (특히 보상 지급 관련).
-   Swagger (OpenAPI)를 이용한 API 문서 자동화.
-   단위/통합/E2E 테스트 코드 작성 및 커버리지 확대.
-   중앙 로깅 시스템 및 APM 도입.
-   API 속도 제한, 보안 헤더 설정 등 보안 강화.
-   필요시 메시지 큐를 이용한 비동기 처리 도입 (예: 보상 지급).
