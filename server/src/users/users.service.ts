import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../database/database.module';
import { users, User } from '../database/schema';

@Injectable()
export class UsersService {
  constructor(@Inject(DATABASE_CONNECTION) private db: any) {}

  async findById(id: number): Promise<User | undefined> {
    const [user] = await this.db.select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return user;
  }

  async findByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await this.db.select()
      .from(users)
      .where(eq(users.phoneNumber, phoneNumber))
      .limit(1);
    return user;
  }
}
