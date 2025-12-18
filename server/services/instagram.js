export class InstagramProvider {
    constructor(config) {
        this.username = config.username;
        this.password = config.password;
    }

    async login() {
        console.log(`[IG] Mock Login for ${this.username}`);
        return true;
    }

    async sendDM(username, text, imagePath) {
        if (!username) return false;
        console.log(`[IG] Sending DM to ${username}: "${text}" with image ${imagePath}`);
        // Real implementation would use 'instagram-private-api' or Graph API
        // For now, we simulate success
        return true;
    }
}
