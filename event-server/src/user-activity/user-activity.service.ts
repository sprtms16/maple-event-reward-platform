import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UserActivityService {
  private readonly logger = new Logger(UserActivityService.name);

  private mockLoginData: Map<string, Date[]> = new Map();
  private mockInvitationData: Map<string, string[]> = new Map();
  private mockQuestClearData: Map<string, Set<string>> = new Map();

  constructor() {
    const testUserId1 = 'mockUser123';
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    this.mockLoginData.set(testUserId1, [twoDaysAgo, yesterday, today]);
    this.mockInvitationData.set(testUserId1, ['friend1', 'friend2']);
    this.mockQuestClearData.set(testUserId1, new Set(['questA', 'questB']));

    const testUserId2 = 'anotherUser456';
    this.mockLoginData.set(testUserId2, [today]);
    this.mockQuestClearData.set(testUserId2, new Set(['questA']));
  }

  async getLoginStreak(userId: string): Promise<number> {
    this.logger.debug(`Fetching login streak for user ID: ${userId}`);
    const logins = this.mockLoginData.get(userId) || [];
    if (logins.length === 0) return 0;

    const uniqueLoginDates = [
      ...new Set(logins.map((date) => date.toISOString().split('T')[0])),
    ]
      .sort()
      .reverse();

    if (uniqueLoginDates.length === 0) return 0;

    let streak = 0;
    const currentDate = new Date(new Date().toISOString().split('T')[0]);

    for (const element of uniqueLoginDates) {
      const loginDate = new Date(element);
      if (loginDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (loginDate < currentDate) {
        break;
      }
    }
    this.logger.log(`User ${userId} login streak: ${streak}`);
    return streak;
  }

  async getFriendInvitationCount(userId: string): Promise<number> {
    this.logger.debug(
      `Fetching friend invitation count for user ID: ${userId}`,
    );
    const invitations = this.mockInvitationData.get(userId) || [];
    const count = invitations.length;
    this.logger.log(`User ${userId} friend invitation count: ${count}`);
    return count;
  }

  async hasClearedQuest(userId: string, questId: string): Promise<boolean> {
    this.logger.debug(
      `Checking if user ID: ${userId} has cleared quest ID: ${questId}`,
    );
    const clearedQuests = this.mockQuestClearData.get(userId) || new Set();
    const hasCleared = clearedQuests.has(questId);
    this.logger.log(`User ${userId} cleared quest ${questId}: ${hasCleared}`);
    return hasCleared;
  }

  async getMinimumPurchaseAmount(userId: string): Promise<number> {
    this.logger.debug(
      `Fetching minimum purchase amount for user ID: ${userId}`,
    );
    // 목 데이터: 사용자가 10000원 이상 구매했다고 가정
    const mockPurchaseAmount = 15000;
    this.logger.log(
      `User ${userId} mock purchase amount: ${mockPurchaseAmount}`,
    );
    return mockPurchaseAmount;
  }

  addMockLogin(userId: string, date: Date) {
    const logins = this.mockLoginData.get(userId) || [];
    logins.push(date);
    this.mockLoginData.set(userId, logins);
  }
  addMockInvitation(userId: string, friendId: string) {
    const invites = this.mockInvitationData.get(userId) || [];
    invites.push(friendId);
    this.mockInvitationData.set(userId, invites);
  }
  addMockQuestClear(userId: string, questId: string) {
    const quests = this.mockQuestClearData.get(userId) || new Set();
    quests.add(questId);
    this.mockQuestClearData.set(userId, quests);
  }
}
