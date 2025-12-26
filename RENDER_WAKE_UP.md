# How to Keep Render Backend Active (Forever)

Render's free tier automatically "spins down" (goes to sleep) after **15 minutes** of inactivity. Here is how to keep it awake so your users never experience a "slow start."

## 1. Internal Self-Ping (Implemented)
I have added a script in `server/utils/keepAlive.js` that pings the server every 14 minutes. 
- **Pros:** Automatic, no extra setup.
- **Cons:** If Render stops the process completely, it can't wake itself up.

## 2. GitHub Actions (Implemented)
I have added a workflow in `.github/workflows/keep-alive.yml` that pings your URL every 15 minutes.
- **Pros:** Reliable external trigger.
- **Cons:** Relies on GitHub Actions being enabled for the repo.

## 3. Recommended: External Monitoring (Best Solution)
For 100% reliability, use a free external monitoring service. They are designed for this exact purpose.

### Using UptimeRobot (Free)
1.  Go to [UptimeRobot.com](https://uptimerobot.com/).
2.  Create a free account.
3.  Click **Add New Monitor**.
4.  **Monitor Type:** HTTP(s).
5.  **Friendly Name:** BytePresence Backend.
6.  **URL (or IP):** `https://byte-copied.onrender.com/api/health`
7.  **Monitoring Interval:** 5 minutes (or 15 minutes).
8.  Save it.

### Using Cron-job.org (Free)
1.  Go to [cron-job.org](https://cron-job.org/).
2.  Create a free account.
3.  Create a new "Cron-job".
4.  **Title:** Keep Render Awake.
5.  **Address:** `https://byte-copied.onrender.com/api/health`
6.  **Schedule:** Every 15 minutes.
7.  Save it.

By using one of these, your backend will **never** go to sleep.
