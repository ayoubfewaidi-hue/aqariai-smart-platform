# AqariAI Smart Platform

Complete AqariAi platform with these strategic improvements:

═══════════════════════════════════════════════════

## 1. SCREEN CLEANUP (Remove all redundancy)

- Remove any duplicated sections

- Ensure each section appears only once

- Unify design across all screens

- Remove the property input form from BUYER portal completely

- Keep property input ONLY in SELLER portal

═══════════════════════════════════════════════════

## 2. SMART DATA EXTRACTION FROM PLAN IMAGE

Add to SELLER portal: "ارفع مخطط الأرض" (Upload land plan)

Features:

- Drag & drop or upload image

- AI extracts automatically:

  * المساحة

  * رقم القطعة

  * الحوض

  * القرية

  * الإحداثيات (if visible)

  * التنظيم (from official sources)

Show confirmation: "استخرجنا البيانات التالية من المخطط .. هل هي صحيحة؟"

Allow manual edit if needed.

═══════════════════════════════════════════════════

## 3. ATTACHMENTS UPLOAD (Multi-file)

Allow seller to upload:

- صورة المخطط (Land plan)

- ترخيص البناء (Building permit)

- وثيقة الملكية (Ownership document)

- صور إضافية (Additional photos)

- أي مستندات (Any documents)

Each attachment:

- Shows thumbnail

- Has "تحقق" (verify) badge

- Stored securely

═══════════════════════════════════════════════════

## 4. SMOOTH USER JOURNEY (No Complications)

### Seller Journey (Simplified):

Step 1: Portal → Seller

Step 2: Upload plan OR enter data

Step 3: AI extracts + analyzes (automatic)

Step 4: Review results

Step 5: Generate marketing (one click)

Step 6: Publish (one click)

### Buyer Journey (Simplified):

Step 1: Portal → Buyer

Step 2: Search or chat with AI Advisor

Step 3: View properties with Match Score

Step 4: Click property → Full analysis

Step 5: Book viewing or contact

NO FORMS in Buyer portal.

NO COMPLEXITY.

═══════════════════════════════════════════════════

## 5. AI-DRIVEN MARKETING POLICY

The platform intelligently decides what to show each user based on:

### For Buyers:

- Search history

- Favorite properties

- Budget range

- Preferred areas

- Family size

- Investment goals

Show:

- Personalized property recommendations

- Match Score (0-100)

- Highlighted features matching their needs

- Similar alternatives

### For Sellers:

- Property type

- Price range

- Market timing

- Competition level

- Target audience

Show:

- Optimized marketing package

- Best posting channels

- Best time to publish

- Suggested pricing strategy

- Expected time to sell

### Marketing Content Generation (Auto):

When seller adds property, AI automatically:

1. Generates 3 ad titles

2. Writes full description

3. Creates hashtags

4. Suggests channels

5. Recommends budget

6. Sets posting time

═══════════════════════════════════════════════════

## 6. POLISH & FINALIZATION

- Smooth transitions between screens

- Loading states everywhere

- Error handling

- Empty states with helpful messages

- Mobile-first responsive

- Fix all broken elements

═══════════════════════════════════════════════════

Design:

- Keep RTL Arabic

- Dark navy #0B132B, Gold #D4AF37, Emerald #064E3B

- Glassmorphism

- Cairo font

- Clean, professional

Keep all existing content (4 properties, AI engine, analysis, portals).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b04904b9-6e1d-4937-ac0f-37c1f8d1df6e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
