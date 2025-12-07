# TalentScout X MVP

[![GitHub Repo](https://github.com/petalzx/talentscout-x)](https://github.com/petalzx/talentscout-x)

## Setup

1. Create and activate virtual environment:
   ```
   python3 -m venv venv
   source venv/bin/activate  # On macOS/Linux
   # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

No Node.js or Prisma CLI needed (switched to aiosqlite for simplicity and immediate runnability).

Database tables are automatically created on application startup.

4. Set up environment variables in `.env`:
   - `XAI_API_KEY`: Your xAI Grok API key
   - `TWITTER_BEARER_TOKEN`: Your Twitter API v2 Bearer Token (for search_recent_tweets)

5. Run the server:
   ```
   python main.py
   ```
   Or for development:
   ```
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Usage

- POST `/scout`
  - Body: `{"role_title": "Backend Engineer", "keywords": ["FastAPI", "Postgres"], "location_filter": "US"}`
  - Searches X for relevant tweets, fetches user profiles, analyzes with xAI Grok, ranks, persists, and returns ranked list.
  - Requires `TWITTER_BEARER_TOKEN` in .env for full functionality; otherwise falls back with error.
  - xAI model used: grok-beta (update in code if grok-2-1212 becomes available).

## Backend Status
Fully implemented as per spec: X API sourcing, Grok ranking, SQLite persistence, FastAPI endpoint.

## iOS Frontend Setup
1. Open Xcode, create new iOS App project named "TalentScoutX" with SwiftUI interface.
2. Add backend URL: Use `http://localhost:8000/scout` for local testing (or deploy backend to ngrok/Vercel for device testing).
3. Implement views as per guidelines below.
4. Add imports: import SwiftUI, import SafariServices for deep links.

### Key Files to Add:

#### Models.swift
```swift
import Foundation

struct ScoutRequest: Codable {
    let roleTitle: String
    let keywords: [String]
    let locationFilter: String?
}

struct CandidateMatch: Codable, Identifiable {
    let id = UUID()
    let handle: String
    let matchScore: Int
    let reasoning: String
}
```

#### NetworkManager.swift
```swift
import Foundation

class NetworkManager: ObservableObject {
    static let shared = NetworkManager()
    private init() {}
    
    func scout(roleTitle: String, keywords: [String], locationFilter: String? = nil) async throws -> [CandidateMatch] {
        let requestData = ScoutRequest(roleTitle: roleTitle, keywords: keywords, locationFilter: locationFilter)
        let jsonData = try JSONEncoder().encode(requestData)
        
        var urlRequest = URLRequest(url: URL(string: "http://localhost:8000/scout")!)
        urlRequest.httpMethod = "POST"
        urlRequest.setValue("application/json", forHTTPHeaderField: "Content-Type")
        urlRequest.httpBody = jsonData
        
        let (data, _) = try await URLSession.shared.data(for: urlRequest)
        return try JSONDecoder().decode([CandidateMatch].self, from: data)
    }
}
```

#### ContentView.swift (Main UI)
```swift
import SwiftUI
import SafariServices  // For deep links

struct ContentView: View {
    @State private var roleTitle = ""
    @State private var keywords: [String] = []
    @State private var newKeyword = ""
    @State private var locationFilter = ""
    @State private var candidates: [CandidateMatch] = []
    @State private var isLoading = false
    @State private var showingSafari = false
    @State private var selectedHandle: String?
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                TextField("Role Title (e.g., Backend Engineer)", text: $roleTitle)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                VStack {
                    HStack {
                        TextField("Add keyword", text: $newKeyword)
                            .textFieldStyle(RoundedBorderTextFieldStyle())
                        Button("Add") {
                            if !newKeyword.isEmpty {
                                keywords.append(newKeyword)
                                newKeyword = ""
                            }
                        }
                    }
                    List(keywords, id: \.self) { keyword in
                        Text(keyword)
                    }
                    .onDelete(perform: deleteKeyword)
                }
                
                TextField("Location Filter (e.g., US)", text: $locationFilter)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                Button("Scout Talent") {
                    Task {
                        isLoading = true
                        do {
                            candidates = try await NetworkManager.shared.scout(
                                roleTitle: roleTitle,
                                keywords: keywords,
                                locationFilter: locationFilter.isEmpty ? nil : locationFilter
                            )
                        } catch {
                            print("Error: \(error)")
                            candidates = []
                        }
                        isLoading = false
                    }
                }
                .disabled(roleTitle.isEmpty || keywords.isEmpty || isLoading)
                .buttonStyle(.borderedProminent)
                
                if isLoading {
                    ProgressView("Analyzing profiles with AI...")
                }
                
                List(candidates) { candidate in
                    VStack(alignment: .leading) {
                        HStack {
                            Text(candidate.handle)
                                .font(.headline)
                            Spacer()
                            Text("\(candidate.matchScore)%")
                                .font(.title2)
                                .foregroundStyle(matchColor(for: candidate.matchScore))
                        }
                        Text(candidate.reasoning)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Button("View on X") {
                            selectedHandle = candidate.handle
                            showingSafari = true
                        }
                        .buttonStyle(.bordered)
                    }
                    .onTapGesture {
                        selectedHandle = candidate.handle
                        showingSafari = true
                    }
                }
            }
            .padding()
            .navigationTitle("TalentScout X")
            .sheet(isPresented: $showingSafari) {
                if let handle = selectedHandle {
                    SafariView(url: URL(string: "https://x.com\(handle)")!)
                }
            }
        }
    }
    
    private func deleteKeyword(at offsets: IndexSet) {
        keywords.remove(atOffsets: offsets)
    }
    
    private func matchColor(for score: Int) -> Color {
        switch score {
        case 90...: return .green
        case 70...: return .orange
        case 50...: return .yellow
        default: return .red
        }
    }
}

// SafariView for deep linking
struct SafariView: UIViewControllerRepresentable {
    let url: URL
    
    func makeUIViewController(context: Context) -> SFSafariViewController {
        SFSafariViewController(url: url)
    }
    
    func updateUIViewController(_ uiViewController: SFSafariViewController, context: Context) {}
}

#Preview {
    ContentView()
}
```

#### TalentScoutXApp.swift (Update existing)
```swift
import SwiftUI

@main
struct TalentScoutXApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

5. Test in Simulator: Run backend on localhost:8000, then build iOS app. For device testing, expose backend via ngrok.
6. Enhancements: Add error handling, better UI, keyword management.

## Notes

- Database: SQLite `dev.db` (ignored in git).
- Deployment: Localhost for MVP, zero-ops.
- API Docs: Available at http://localhost:8000/docs (Swagger)