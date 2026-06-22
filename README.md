# KPI Template

ระบบบันทึกแนวทางการบันทึกข้อมูลผลการดำเนินงาน KPI สำหรับจัดการ template การบันทึกข้อมูล, กลุ่มงาน, เอกสารอ้างอิง Google Drive และรายละเอียดการบันทึกผลงาน

## Current Progress

- Landing page เป็นรายการ KPI พร้อม filter ชื่อ KPI และกลุ่มงาน
- Datagrid แสดง `#`, `ชื่อ KPI`, `กลุ่มงาน`, `เอกสาร`, และปุ่ม edit
- คลิกชื่อ KPI เพื่อดูรายละเอียดแบบ view-only และ copy ข้อความได้
- คลิก edit icon ต้องกรอกรหัสผ่านก่อนแก้ไข
- Modal รายละเอียดเป็น full-screen form
- รองรับการเพิ่มและบันทึกข้อมูลจริงลง PostgreSQL
- เอกสารอ้างอิงรับเฉพาะ Google Drive URL และเปิด link ในแท็บใหม่
- มี table interface/model สำหรับ schema ใน `src/lib/table-interface.ts`

## Tech Stack

- Next.js
- React
- PostgreSQL
- Tailwind CSS
- lucide-react
- SweetAlert2

## Development

```bash
npm install
npm run dev
```

เปิดใช้งานที่:

```text
http://localhost:3000
```

## Checks

```bash
npx tsc --noEmit --pretty false
npm run lint
npm test
npm run build
```

## Database

อ่านค่า database connection จาก `.env`

```text
DB_HOST
DB_PORT
DB_USER
DB_PASSWORD
DB_NAME
DATABASE_URL
```

ใช้ `db-cli` สำหรับงาน database โดยอ่าน config จาก `.env`

## Production

Production path:

```text
/var/www/wwwroot/template.plkhealth.go.th/template
```

PM2:

```text
template
port 3013
```

Public URL:

```text
https://template.plkhealth.go.th/
```
