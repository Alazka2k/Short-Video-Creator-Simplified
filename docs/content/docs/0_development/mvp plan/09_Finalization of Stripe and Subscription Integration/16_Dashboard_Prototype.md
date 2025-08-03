<!DOCTYPE html>
<html lang="en" class="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Narravid Dashboard - MVP</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --brand-primary: #B24BF3;
            --brand-secondary: #9747FF;
            --brand-accent: #7C3AED;
            
            --bg-main: #0A0A0C;
            --bg-card: #18181B;
            --bg-element: #27272A;
            --bg-hover: #3F3F46;
            
            --text-primary: #FFFFFF;
            --text-secondary: #A1A1AA;
            --text-muted: #71717A;
            
            --border-primary: #27272A;
            --border-secondary: #3F3F46;
            
            --success: #10B981;
            --warning: #F59E0B;
            --error: #EF4444;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-main);
            color: var(--text-primary);
            overflow-x: hidden;
        }

        .dashboard {
            display: grid;
            grid-template-columns: 280px 1fr;
            min-height: 100vh;
        }

        /* Sidebar - Maintaining current design */
        .sidebar {
            background: var(--bg-card);
            border-right: 1px solid var(--border-primary);
            padding: 24px 0;
            position: fixed;
            height: 100vh;
            width: 280px;
            z-index: 10;
        }

        .sidebar-logo {
            padding: 0 24px 24px;
            border-bottom: 1px solid var(--border-primary);
            margin-bottom: 24px;
        }

        .sidebar-logo h2 {
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-size: 18px;
            font-weight: 700;
        }

        .sidebar-nav {
            list-style: none;
        }

        .sidebar-nav li {
            margin-bottom: 4px;
        }

        .sidebar-nav a {
            display: flex;
            align-items: center;
            padding: 12px 24px;
            text-decoration: none;
            color: var(--text-secondary);
            transition: all 0.2s ease;
            border-radius: 0 25px 25px 0;
            margin-right: 20px;
            font-size: 14px;
        }

        .sidebar-nav a:hover, .sidebar-nav a.active {
            background: linear-gradient(90deg, rgba(178, 75, 243, 0.1) 0%, transparent 100%);
            color: var(--brand-primary);
            transform: translateX(8px);
        }

        .sidebar-nav .icon {
            margin-right: 12px;
            width: 20px;
            text-align: center;
        }

        /* Main Content */
        .main-content {
            background: var(--bg-main);
            margin-left: 280px;
            min-height: 100vh;
        }

        /* Header - Maintaining current design */
        .header {
            background: var(--bg-card);
            padding: 16px 32px;
            border-bottom: 1px solid var(--border-primary);
            display: flex;
            justify-content: space-between;
            align-items: center;
            position: sticky;
            top: 0;
            z-index: 5;
        }

        .header-left h1 {
            font-size: 24px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .token-indicator {
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
            cursor: pointer;
        }

        /* Content Area */
        .content {
            padding: 32px;
        }

        /* Welcome Section */
        .welcome-section {
            background: linear-gradient(135deg, var(--bg-card), var(--bg-element));
            border-radius: 20px;
            padding: 40px;
            margin-bottom: 32px;
            border: 1px solid var(--border-primary);
            position: relative;
            overflow: hidden;
        }

        .welcome-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--brand-primary), transparent);
        }

        .welcome-title {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 12px;
            background: linear-gradient(135deg, var(--text-primary), var(--text-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .welcome-subtitle {
            color: var(--text-secondary);
            margin-bottom: 32px;
            font-size: 16px;
        }

        .quick-actions {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
        }

        .quick-action-card {
            background: var(--bg-element);
            border: 1px solid var(--border-primary);
            border-radius: 16px;
            padding: 24px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }

        .quick-action-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(178, 75, 243, 0.1), transparent);
            transition: left 0.5s ease;
        }

        .quick-action-card:hover {
            transform: translateY(-4px);
            border-color: var(--brand-primary);
            box-shadow: 0 20px 40px rgba(178, 75, 243, 0.1);
        }

        .quick-action-card:hover::before {
            left: 100%;
        }

        .quick-action-icon {
            font-size: 40px;
            margin-bottom: 16px;
            display: block;
        }

        .quick-action-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 8px;
        }

        .quick-action-desc {
            color: var(--text-secondary);
            font-size: 14px;
            margin-bottom: 20px;
        }

        .quick-action-btn {
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
            width: 100%;
        }

        .quick-action-btn:hover {
            transform: scale(1.05);
        }

        /* Statistics Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 20px;
        }

        .stats-grid-bottom {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-bottom: 32px;
        }

        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--border-primary);
            border-radius: 16px;
            padding: 24px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .stat-card:hover {
            transform: translateY(-2px);
            border-color: var(--brand-primary);
        }

        .stat-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
        }

        .stat-title {
            color: var(--text-secondary);
            font-size: 14px;
            font-weight: 500;
        }

        .stat-icon {
            font-size: 20px;
        }

        .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: 8px;
        }

        .stat-breakdown {
            font-size: 12px;
            color: var(--text-muted);
            line-height: 1.4;
        }

        .stat-change {
            font-size: 12px;
            color: var(--success);
            font-weight: 500;
        }

        /* Content Sections */
        .content-section {
            background: var(--bg-card);
            border: 1px solid var(--border-primary);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 32px;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .section-title {
            font-size: 20px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .view-all {
            color: var(--brand-primary);
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: color 0.2s ease;
        }

        .view-all:hover {
            color: var(--brand-secondary);
        }

        /* Job Items */
        .job-item {
            background: var(--bg-element);
            border: 1px solid var(--border-primary);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
            transition: all 0.2s ease;
        }

        .job-item:hover {
            border-color: var(--brand-primary);
            transform: translateY(-2px);
        }

        .job-item:last-child {
            margin-bottom: 0;
        }

        .job-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
        }

        .job-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 4px;
        }

        .job-meta {
            color: var(--text-secondary);
            font-size: 12px;
        }

        .job-time {
            color: var(--text-muted);
            font-size: 12px;
        }

        .content-badges {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }

        .content-badge {
            background: var(--bg-hover);
            border: 1px solid var(--border-secondary);
            padding: 4px 8px;
            border-radius: 8px;
            font-size: 11px;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            gap: 4px;
        }

        .job-actions {
            display: flex;
            gap: 8px;
        }

        .job-action {
            background: rgba(178, 75, 243, 0.1);
            border: 1px solid rgba(178, 75, 243, 0.3);
            color: var(--brand-primary);
            padding: 6px 12px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .job-action:hover {
            background: rgba(178, 75, 243, 0.2);
            transform: translateY(-1px);
        }

        /* Video Gallery */
        .video-gallery {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 16px;
        }

        .video-card {
            background: var(--bg-element);
            border: 1px solid var(--border-primary);
            border-radius: 12px;
            overflow: hidden;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .video-card:hover {
            transform: translateY(-4px);
            border-color: var(--brand-primary);
            box-shadow: 0 10px 30px rgba(178, 75, 243, 0.1);
        }

        .video-thumbnail {
            width: 100%;
            aspect-ratio: 16/9;
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            color: white;
            position: relative;
        }

        .video-info {
            padding: 12px;
        }

        .video-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .video-stats {
            color: var(--text-secondary);
            font-size: 11px;
            line-height: 1.3;
        }

        /* Token Balance Section */
        .token-section {
            background: linear-gradient(135deg, var(--bg-card), var(--bg-element));
            border: 1px solid var(--border-primary);
            border-radius: 16px;
            padding: 32px;
            position: relative;
            overflow: hidden;
        }

        .token-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(90deg, transparent, var(--brand-primary), transparent);
        }

        .token-display {
            text-align: center;
            margin-bottom: 24px;
        }

        .token-amount {
            font-size: 48px;
            font-weight: 700;
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
        }

        .token-label {
            color: var(--text-secondary);
            font-size: 16px;
        }

        .token-progress {
            background: var(--bg-element);
            border-radius: 10px;
            height: 8px;
            margin: 24px 0;
            overflow: hidden;
        }

        .token-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--brand-primary), var(--brand-secondary));
            border-radius: 10px;
            width: 65%;
            transition: width 0.3s ease;
        }

        .token-meta {
            display: flex;
            justify-content: space-between;
            color: var(--text-secondary);
            font-size: 14px;
            margin-bottom: 24px;
        }

        .token-actions {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 24px;
        }

        .token-action {
            background: var(--bg-element);
            border: 1px solid var(--border-primary);
            padding: 12px;
            border-radius: 10px;
            text-align: center;
            text-decoration: none;
            color: var(--text-primary);
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s ease;
        }

        .token-action:hover {
            border-color: var(--brand-primary);
            transform: translateY(-2px);
        }

        .token-action.primary {
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
            color: white;
            border-color: var(--brand-primary);
        }

        .plan-info {
            text-align: center;
            color: var(--text-secondary);
            font-size: 14px;
        }

        /* Empty State */
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--text-secondary);
        }

        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 16px;
            opacity: 0.6;
        }

        .empty-state-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 8px;
        }

        .empty-state-desc {
            font-size: 14px;
            margin-bottom: 24px;
        }

        .empty-state-btn {
            background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            display: inline-block;
            transition: transform 0.2s ease;
        }

        .empty-state-btn:hover {
            transform: translateY(-2px);
        }
        @media (max-width: 1024px) {
            .dashboard {
                grid-template-columns: 1fr;
            }
            
            .sidebar {
                display: none;
            }
            
            .main-content {
                margin-left: 0;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .stats-grid-bottom {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .quick-actions {
                grid-template-columns: 1fr;
            }
            
            .video-gallery {
                grid-template-columns: repeat(3, 1fr);
            }
        }

        @media (max-width: 768px) {
            .stats-grid {
                grid-template-columns: 1fr;
            }
            
            .stats-grid-bottom {
                grid-template-columns: 1fr;
            }
            
            .video-gallery {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .token-actions {
                grid-template-columns: 1fr;
            }
        }

        /* Animations */
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .animate-slide-up {
            animation: slideInUp 0.6s ease-out;
        }

        @keyframes countUp {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        .animate-count {
            animation: countUp 0.8s ease-out;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <!-- Demo Note: Press Ctrl+E to toggle empty states -->
        <div style="position: fixed; bottom: 10px; right: 10px; background: var(--bg-card); padding: 8px 12px; border-radius: 8px; font-size: 11px; color: var(--text-muted); z-index: 1000;">
            Demo: Ctrl+E to toggle empty states
        </div>
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-logo">
                <h2>🎬 Narravid</h2>
            </div>
            <ul class="sidebar-nav">
                <li><a href="#" class="active"><span class="icon">📊</span> Dashboard</a></li>
                <li><a href="#"><span class="icon">✨</span> Create Content</a></li>
                <li><a href="#"><span class="icon">🗂️</span> Content Workbench</a></li>
                <li><a href="#"><span class="icon">🎬</span> Videos</a></li>
                <li><a href="#"><span class="icon">💳</span> Subscription</a></li>
                <li><a href="#"><span class="icon">⚙️</span> Settings</a></li>
            </ul>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <!-- Header -->
            <div class="header">
                <div class="header-left">
                    <h1>Dashboard</h1>
                    <p style="color: var(--text-secondary); font-size: 14px; margin-top: 4px;">Create and manage your video content</p>
                </div>
                <div class="header-right">
                    <div class="token-indicator">💎 2,450 tokens</div>
                    <div class="user-avatar">JD</div>
                </div>
            </div>

            <!-- Content -->
            <div class="content">
                <!-- Welcome Section -->
                <div class="welcome-section animate-slide-up">
                    <h1 class="welcome-title">Welcome back, Creator! 👋</h1>
                    <p class="welcome-subtitle">You have 2,450 tokens remaining • 3 creations in progress</p>
                    
                    <div class="quick-actions">
                        <div class="quick-action-card">
                            <span class="quick-action-icon">🎬</span>
                            <h3 class="quick-action-title">Quick Create</h3>
                            <p class="quick-action-desc">Generate video from text in one click. Perfect for quick content creation.</p>
                            <button class="quick-action-btn">Start Creating</button>
                        </div>
                        <div class="quick-action-card">
                            <span class="quick-action-icon">📚</span>
                            <h3 class="quick-action-title">Browse Library</h3>
                            <p class="quick-action-desc">Past creations & templates. Access your content library and reuse previous work.</p>
                            <button class="quick-action-btn">View Library</button>
                        </div>
                    </div>
                </div>

                <!-- Content Statistics Section -->
                <div class="content-section">
                    <div class="section-header">
                        <h2 class="section-title">📝 Created Content</h2>
                        <a href="#" class="view-all">View All</a>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card animate-count">
                            <div class="stat-header">
                                <span class="stat-title">🖼️ Images</span>
                                <span class="stat-icon">🖼️</span>
                            </div>
                            <div class="stat-value">45</div>
                            <div class="stat-change">+8 This Week</div>
                        </div>
                        
                        <div class="stat-card animate-count">
                            <div class="stat-header">
                                <span class="stat-title">🎤 Voice</span>
                                <span class="stat-icon">🎤</span>
                            </div>
                            <div class="stat-value">38</div>
                            <div class="stat-change">+6 This Week</div>
                        </div>
                        
                        <div class="stat-card animate-count">
                            <div class="stat-header">
                                <span class="stat-title">🎵 Music</span>
                                <span class="stat-icon">🎵</span>
                            </div>
                            <div class="stat-value">28</div>
                            <div class="stat-change">+4 This Week</div>
                        </div>
                        
                        <div class="stat-card animate-count">
                            <div class="stat-header">
                                <span class="stat-title">🎬 Animation</span>
                                <span class="stat-icon">🎬</span>
                            </div>
                            <div class="stat-value">35</div>
                            <div class="stat-change">+7 This Week</div>
                        </div>
                    </div>

                    <div class="stats-grid-bottom">
                        <div class="stat-card animate-count">
                            <div class="stat-header">
                                <span class="stat-title">🎞️ Videos</span>
                                <span class="stat-icon">🎞️</span>
                            </div>
                            <div class="stat-value">31</div>
                            <div class="stat-change">+5 This Week</div>
                        </div>
                        
                        <div class="stat-card animate-count">
                            <div class="stat-header">
                                <span class="stat-title">🎬 Completed Videos</span>
                                <span class="stat-icon">✅</span>
                            </div>
                            <div class="stat-value">12</div>
                            <div class="stat-change">+3 This Week</div>
                        </div>
                        
                        <div class="stat-card animate-count">
                            <div class="stat-header">
                                <span class="stat-title">💎 Token Usage</span>
                                <span class="stat-icon">⚡</span>
                            </div>
                            <div class="stat-value">6,500</div>
                            <div class="stat-breakdown">
                                Used: 6,500<br>
                                Remaining: 3,500<br>
                                <span style="color: var(--warning);">65% Consumed</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recently Completed Creations -->
                <div class="content-section">
                    <div class="section-header">
                        <h2 class="section-title">Recently Completed Creations</h2>
                        <a href="#" class="view-all">View All</a>
                    </div>

                    <!-- Show jobs or empty state -->
                    <div id="jobs-content">
                        <div class="job-item">
                            <div class="job-header">
                                <div>
                                    <div class="job-title">✅ "AI Robot Uprising Story"</div>
                                    <div class="job-meta">Job #abc-123 • 5 scenes</div>
                                </div>
                                <div class="job-time">2 hours ago</div>
                            </div>
                            <div class="content-badges">
                                <span class="content-badge">🖼️ 5</span>
                                <span class="content-badge">🎤 5</span>
                                <span class="content-badge">🎵 1</span>
                                <span class="content-badge">🎬 5</span>
                                <span class="content-badge">🎞️ 5</span>
                            </div>
                            <div class="job-actions">
                                <a href="#" class="job-action">👁️ Preview</a>
                                <a href="#" class="job-action">⬇️ Download</a>
                                <a href="#" class="job-action">🔄 Create Similar</a>
                            </div>
                        </div>

                        <div class="job-item">
                            <div class="job-header">
                                <div>
                                    <div class="job-title">✅ "Tech Review: Future Gadgets"</div>
                                    <div class="job-meta">Job #def-456 • 3 scenes</div>
                                </div>
                                <div class="job-time">5 hours ago</div>
                            </div>
                            <div class="content-badges">
                                <span class="content-badge">🖼️ 3</span>
                                <span class="content-badge">🎤 3</span>
                                <span class="content-badge">🎵 1</span>
                                <span class="content-badge">🎬 3</span>
                                <span class="content-badge">🎞️ 3</span>
                            </div>
                            <div class="job-actions">
                                <a href="#" class="job-action">👁️ Preview</a>
                                <a href="#" class="job-action">⬇️ Download</a>
                                <a href="#" class="job-action">🔄 Create Similar</a>
                            </div>
                        </div>

                        <div class="job-item">
                            <div class="job-header">
                                <div>
                                    <div class="job-title">✅ "Cooking Hack Tutorial"</div>
                                    <div class="job-meta">Job #ghi-789 • 2 scenes</div>
                                </div>
                                <div class="job-time">1 day ago</div>
                            </div>
                            <div class="content-badges">
                                <span class="content-badge">🖼️ 2</span>
                                <span class="content-badge">🎤 2</span>
                                <span class="content-badge">🎵 1</span>
                                <span class="content-badge">🎬 2</span>
                                <span class="content-badge">🎞️ 2</span>
                            </div>
                            <div class="job-actions">
                                <a href="#" class="job-action">👁️ Preview</a>
                                <a href="#" class="job-action">⬇️ Download</a>
                                <a href="#" class="job-action">🔄 Create Similar</a>
                            </div>
                        </div>
                    </div>

                    <!-- Fallback empty state (hidden by default) -->
                    <div id="jobs-empty" class="empty-state" style="display: none;">
                        <div class="empty-state-icon">🎬</div>
                        <div class="empty-state-title">No creations yet</div>
                        <div class="empty-state-desc">Start creating your first video!</div>
                        <a href="#" class="empty-state-btn">🎬 Create Video</a>
                    </div>
                </div>

                <!-- Recently Completed Videos -->
                <div class="content-section">
                    <div class="section-header">
                        <h2 class="section-title">Recently Completed Videos</h2>
                        <a href="#" class="view-all">View All</a>
                    </div>

                    <!-- Show videos or empty state -->
                    <div id="videos-content">
                        <div class="video-gallery">
                            <div class="video-card">
                                <div class="video-thumbnail">🚀</div>
                                <div class="video-info">
                                    <div class="video-title">"Space Exploration 2024"</div>
                                    <div class="video-stats">45s • 1.2K views<br>2 hours ago</div>
                                </div>
                            </div>
                            
                            <div class="video-card">
                                <div class="video-thumbnail">🍳</div>
                                <div class="video-info">
                                    <div class="video-title">"Cooking Hack Tutorial"</div>
                                    <div class="video-stats">30s • 856 views<br>5 hours ago</div>
                                </div>
                            </div>
                            
                            <div class="video-card">
                                <div class="video-thumbnail">🎮</div>
                                <div class="video-info">
                                    <div class="video-title">"Gaming Setup Tour"</div>
                                    <div class="video-stats">60s • 543 views<br>1 day ago</div>
                                </div>
                            </div>
                            
                            <div class="video-card">
                                <div class="video-thumbnail">🎬</div>
                                <div class="video-info">
                                    <div class="video-title">"Movie Review: Sci-Fi"</div>
                                    <div class="video-stats">90s • 2.1K views<br>2 days ago</div>
                                </div>
                            </div>
                            
                            <div class="video-card">
                                <div class="video-thumbnail">📱</div>
                                <div class="video-info">
                                    <div class="video-title">"Tech News Update"</div>
                                    <div class="video-stats">35s • 678 views<br>3 days ago</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Fallback empty state (hidden by default) -->
                    <div id="videos-empty" class="empty-state" style="display: none;">
                        <div class="empty-state-icon">📹</div>
                        <div class="empty-state-title">No videos created yet</div>
                        <div class="empty-state-desc">Your completed videos will appear here</div>
                        <a href="#" class="empty-state-btn">🎬 Create Video</a>
                    </div>
                </div>

                <!-- Token Balance Section -->
                <div class="token-section">
                    <div class="section-header">
                        <h2 class="section-title">Token Balance</h2>
                    </div>
                    
                    <div class="token-display">
                        <div class="token-amount">2,450</div>
                        <div class="token-label">remaining tokens</div>
                    </div>
                    
                    <div class="token-progress">
                        <div class="token-progress-fill"></div>
                    </div>
                    
                    <div class="token-meta">
                        <span>Monthly Limit: 10,000</span>
                        <span>Resets: Feb 1, 2025</span>
                    </div>
                    
                    <div class="token-actions">
                        <a href="#" class="token-action primary">💳 Buy Tokens</a>
                        <a href="#" class="token-action" style="opacity: 0.5; cursor: not-allowed;">📊 Usage Analytics<br><small>(Coming Soon)</small></a>
                        <a href="#" class="token-action">⬆️ Upgrade Plan</a>
                    </div>
                    
                    <div class="plan-info">
                        Current Plan: Pro Creator ($49/month)
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Add interactive functionality
        document.addEventListener('DOMContentLoaded', function() {
            // Add click handlers for cards
            const cards = document.querySelectorAll('.quick-action-card, .video-card, .job-item');
            cards.forEach(card => {
                card.addEventListener('click', function(e) {
                    if (!e.target.matches('a, button')) {
                        this.style.transform = 'scale(0.98)';
                        setTimeout(() => {
                            this.style.transform = '';
                        }, 150);
                    }
                });
            });

            // Animate counters
            const animateValue = (element, start, end, duration) => {
                let startTimestamp = null;
                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                    element.textContent = Math.floor(progress * (end - start) + start);
                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    }
                };
                window.requestAnimationFrame(step);
            };

            // Animate stat values
            setTimeout(() => {
                const statValues = document.querySelectorAll('.stat-value');
                const values = [45, 38, 28, 35, 31, 12, 6500];
                statValues.forEach((stat, index) => {
                    animateValue(stat, 0, values[index], 1000);
                });
            }, 500);

            // Token progress animation
            const progressBar = document.querySelector('.token-progress-fill');
            setTimeout(() => {
                progressBar.style.width = '65%';
            }, 800);

            // Demo: Toggle empty states (for demonstration)
            let showEmptyState = false;
            document.addEventListener('keydown', function(e) {
                if (e.key === 'e' && e.ctrlKey) {
                    showEmptyState = !showEmptyState;
                    
                    // Toggle jobs
                    const jobsContent = document.getElementById('jobs-content');
                    const jobsEmpty = document.getElementById('jobs-empty');
                    jobsContent.style.display = showEmptyState ? 'none' : 'block';
                    jobsEmpty.style.display = showEmptyState ? 'block' : 'none';
                    
                    // Toggle videos
                    const videosContent = document.getElementById('videos-content');
                    const videosEmpty = document.getElementById('videos-empty');
                    videosContent.style.display = showEmptyState ? 'none' : 'block';
                    videosEmpty.style.display = showEmptyState ? 'block' : 'none';
                }
            });
        });
    </script>
</body>
</html>