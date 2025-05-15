export interface UserDailyLogin {
  userId: string;
  loginDate: Date;
}

export interface UserFriendInvitation {
  userId: string;
  invitedFriendId: string;
  invitationDate: Date;
}

export interface UserQuestClear {
  userId: string;
  questId: string;
  clearedAt: Date;
}
