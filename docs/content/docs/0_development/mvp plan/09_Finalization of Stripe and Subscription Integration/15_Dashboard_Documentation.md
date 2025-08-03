# AI Video Creator MVP Dashboard Design

## MVP Dashboard Overview

This refined dashboard focuses on simplicity and essential features for the initial release, incorporating modern UI patterns and innovative components from shadcn/ui.

## Layout Structure

### Fixed Elements (Keeping Current)
- **Sidebar Navigation**: Maintained as shown in prototype
- **Header**: Kept consistent with current design

### Main Content Areas (Redesigned)

## 1. Welcome & Quick Actions Section
**Simplified MVP design with two primary CTAs**

```
┌─────────────────────────────────────────────────────────────────────┐
│ Welcome back, Creator! 👋                                            │
│ You have 2,450 tokens remaining • 3 creations in progress           │
│                                                                     │
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐      │
│ │ 🎬 Quick Create             │ │ 📚 Browse Library           │      │
│ │ Generate video from text    │ │ Past creations & templates  │      │
│ │ in one click. Perfect for   │ │ Access your content library │      │
│ │ quick content creation.     │ │ and reuse previous work.    │      │
│ │ [Start Creating]            │ │ [View Library]              │      │
│ └─────────────────────────────┘ └─────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Content Statistics Grid
**Individual cards for each content type with clear metrics**

**Top Row (4 cards - but summarized in one container for content generation):**
- **🖼️ Images Generated**: Individual count with weekly progress
- **🎤 Voice Generated**: Voice synthesis completions
- **🎵 Music Generated**: Background music creations  
- **🎬 Animation Generated**: Animation completions

**Bottom Row (3 cards):**
- **🎞️ Video Generated**: Amount of videos assembled
- **💎 Token Usage**: Current total token consumption and remaining balance

```
┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ 🖼️ Images     │ │ 🎤 Voice      │ │ 🎵 Music      │ │ 🎬 Animation  │
│ Generated     │ │ Generated     │ │ Generated     │ │ Generated     │
│               │ │               │ │               │ │               │
│ 45            │ │ 38            │ │ 28            │ │ 35            │
│ +8 This Week  │ │ +6 This Week  │ │ +4 This Week  │ │ +7 This Week  │
└───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘

┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ 🎞️ Video      │ │ 🎬 Videos     │ │ 💎 Token      │
│ Generated     │ │ Completed     │ │ Usage         │
│               │ │               │ │               │
│ 31            │ │ 12 Videos     │ │ 6,500 Used    │
│ +5 This Week  │ │ +3 This Week  │ │ 3,500 Left    │
│               │ │               │ │ 65% Consumed  │
└───────────────┘ └───────────────┘ └───────────────┘
```

## 3. Recently Completed Creations (Jobs)
**Job history with fallback for empty state**

-  Max 3 jobs, reuse existing components from the job list

```
┌─────────────────────────────────────────────────────────────────────┐
│ Recently Completed Creations                           [View All]    │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │ ✅ "AI Robot Uprising Story"                    2 hours ago      │ │
│ │ Job #abc-123 • 5 scenes                                         │ │
│ │ [🖼️ 5] [🎤 5] [🎵 1] [🎬 5] [🎞️ 5]                              │ │
│ │ [👁️ Preview] [⬇️ Download] [🔄 Create Similar]                   │ │
│ └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ -- OR FALLBACK WHEN EMPTY --                                       │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                    🎬 No creations yet                          │ │
│ │            Start creating your first video!                    │ │
│ │                                                                 │ │
│ │                    [🎬 Create Video]                            │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 4. Recently Completed Videos
**Video gallery with fallback for empty state**

- Max 3 videos, reuse existing components from the video list
- 

```
┌─────────────────────────────────────────────────────────────────────┐
│ Recently Completed Videos                              [View All]    │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│ │[Thumb]  │ │[Thumb]  │ │[Thumb]  │ │[Thumb]  │ │[Thumb]  │        │
│ │ 🚀      │ │ 🍳      │ │ 🎮      │ │ 🎬      │ │ 📱      │        │
│ │"Space"  │ │"Cook"   │ │"Game"   │ │"Movie"  │ │"Tech"   │        │
│ │         │ │         │ │         │ │         │ │         │        │
│ │2h ago   │ │5h ago   │ │1d ago   │ │2d ago   │ │3d ago   │        │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘        │
│                                                                     │
│ -- OR FALLBACK WHEN EMPTY --                                       │
│                                                                     │
│ ┌─────────────────────────────────────────────────────────────────┐ │
│ │                    📹 No videos created yet                     │ │
│ │               Your completed videos will appear here            │ │
│ │                                                                 │ │
│ │                    [🎬 Create Video]                            │ │
│ └─────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## 5. Token Balance & Plan Status
**Updated with no expiration and period-based allocation**

```
┌─────────────────────────────────────────────────────────────────────┐
│ Token Balance                                                       │
├─────────────────────────────────────────────────────────────────────┤
│                            2,450                                    │
│                         remaining tokens                            │
│                                                                     │
│ ████████████████████████████████████░░░░░░░░░  65% Used            │
│ Monthly Limit: 10,000 • Resets: Feb 1, 2025                       │
│                                                                     │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │
│ │ 💳 Buy Tokens   │ │ 📊 Usage        │ │ ⬆️ Upgrade      │        │
│ │ Add more credits│ │ Analytics       │ │ Plan            │        │
│ │                 │ │ (Coming Soon)   │ │                 │        │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘        │
│                                                                     │
│ Current Plan: Pro Creator ($49/month)                               │
└─────────────────────────────────────────────────────────────────────┘
```

## Innovative shadcn/ui Components Integration

### 1. Reuse existing components to have a unified design
- Reuse existing components from the job list
- Reuse existing components from the video list

## Required API Endpoints for MVP

### Content Statistics
```
POST /api/dashboard/content-stats
```
**Body:** `{}` (userId will be inferred from JWT)
Returns total and weekly counts for each content type (images, voice, music, animations, videos, assembly) of a user

### Token Usage & Balance
```
POST /api/dashboard/token-balance
```
**Body:** `{}` (userId will be inferred from JWT)
Returns user's current token balance, monthly limit, usage percentage, and next token allocation date

### Jobs Endpoint (Existing)
```
GET /api/job/jobs?page=1&limit=3&sortBy=created_at&sortOrder=desc
```
Recent completed jobs for dashboard display

### Videos Endpoint (Review Required)
```
GET /api/assembly/videos?page=1&limit=5&sortBy=created_at&sortOrder=desc
```
Recent completed videos (currently returns 500 error)

### Missing Data Persistence Solutions

**Content Creation Totals:**
- Add aggregate queries across service tables (image_outputs, voice_outputs, etc.)
- Count records by user_id and date ranges
- Cache results in Redis for performance

**Token Usage & Balance:**
- Current balance from `tokens` table
- Usage calculation from `token_transactions` table  
- Monthly limit from user's active subscription plan
- Next token allocation date based on subscription period of the active subscription

**Job Assembly Status:**
- Currently not tracked in database
- Remove assembly indicators from UI until implemented

## Mobile Responsive Considerations

### Mobile Layout Adaptations:
- Statistics cards: 4+3 grid → 2x2 grid (tablet) → single column (mobile)
- Horizontal scroll for video thumbnails
- Collapsible sections for better space usage
- Sticky token balance indicator
- Bottom sheet for job details

### Touch Interactions:
- Swipe gestures for navigation
- Long press for context menus
- Pull-to-refresh functionality
- Haptic feedback for actions

## Accessibility Features

### Screen Reader Support:
- Proper heading hierarchy
- ARIA labels for interactive elements
- Live regions for dynamic updates
- Alt text for all images and icons

### Keyboard Navigation:
- Tab order optimization
- Keyboard shortcuts (⌘K for command palette)
- Focus indicators
- Skip links for main content

## Performance Optimizations

### Data Loading:
- Lazy load below-the-fold content
- Paginated lists with infinite scroll
- Image lazy loading with placeholders
- Skeleton screens during loading

### Caching Strategy:
- Cache dashboard data for 30 seconds
- Cache video thumbnails locally
- Prefetch next page of results
- Service worker for offline viewing

