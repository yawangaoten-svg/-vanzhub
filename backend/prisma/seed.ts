import { PrismaClient, AccountStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding VANZHUB database...');

  const passwordHash = await bcrypt.hash('Password123', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      username: 'alice',
      displayName: 'Alice Johnson',
      passwordHash,
      bio: 'Digital artist & photographer 📸',
      location: 'San Francisco, CA',
      website: 'https://alice.dev',
      emailVerified: true,
      status: AccountStatus.ACTIVE,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      username: 'bob',
      displayName: 'Bob Smith',
      passwordHash,
      bio: 'Full-stack developer & open source enthusiast',
      location: 'New York, NY',
      website: 'https://bob.codes',
      emailVerified: true,
      status: AccountStatus.ACTIVE,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: 'charlie@example.com' },
    update: {},
    create: {
      email: 'charlie@example.com',
      username: 'charlie',
      displayName: 'Charlie Brown',
      passwordHash,
      bio: 'Music producer & DJ 🎵',
      location: 'Los Angeles, CA',
      emailVerified: true,
      status: AccountStatus.ACTIVE,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vanzhub.com' },
    update: {},
    create: {
      email: 'admin@vanzhub.com',
      username: 'admin',
      displayName: 'VANZHUB Admin',
      passwordHash,
      bio: 'VANZHUB administrator',
      emailVerified: true,
      status: AccountStatus.ACTIVE,
    },
  });

  // Create hashtags
  const hashtags = ['tech', 'photography', 'music', 'design', 'coding', 'travel', 'food', 'fitness'];
  for (const name of hashtags) {
    await prisma.hashtag.upsert({
      where: { name },
      update: {},
      create: { name, count: 0 },
    });
  }

  // Create relationships
  await prisma.follower.createMany({
    data: [
      { followerId: alice.id, followingId: bob.id },
      { followerId: bob.id, followingId: alice.id },
      { followerId: charlie.id, followingId: alice.id },
      { followerId: alice.id, followingId: charlie.id },
    ],
    skipDuplicates: true,
  });

  await prisma.friendship.createMany({
    data: [
      { senderId: alice.id, receiverId: bob.id, status: 'ACCEPTED' },
      { senderId: alice.id, receiverId: charlie.id, status: 'ACCEPTED' },
    ],
    skipDuplicates: true,
  });

  const post1 = await prisma.post.create({
    data: {
      content: 'Just finished building a new feature for VANZHUB! The real-time messaging system is working flawlessly. 🚀 #coding #tech',
      authorId: bob.id,
      hashtags: {
        create: [
          { hashtagId: (await prisma.hashtag.findUnique({ where: { name: 'coding' } }))!.id },
          { hashtagId: (await prisma.hashtag.findUnique({ where: { name: 'tech' } }))!.id },
        ],
      },
    },
  });

  const post2 = await prisma.post.create({
    data: {
      content: 'Golden hour at the beach today. Nothing beats the California sunset! 🌅 #photography #travel',
      authorId: alice.id,
      hashtags: {
        create: [
          { hashtagId: (await prisma.hashtag.findUnique({ where: { name: 'photography' } }))!.id },
          { hashtagId: (await prisma.hashtag.findUnique({ where: { name: 'travel' } }))!.id },
        ],
      },
    },
  });

  await prisma.post.create({
    data: {
      content: 'New track dropping next week! Been working on this one for months. Can not wait to share it with you all. 🎵 #music',
      authorId: charlie.id,
      hashtags: {
        create: [
          { hashtagId: (await prisma.hashtag.findUnique({ where: { name: 'music' } }))!.id },
        ],
      },
    },
  });

  // Create comments
  await prisma.comment.create({
    data: {
      content: 'That sounds amazing! Can not wait to try it out.',
      authorId: alice.id,
      postId: post1.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Absolutely stunning photo!',
      authorId: bob.id,
      postId: post2.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'The colors are incredible! What camera did you use?',
      authorId: charlie.id,
      postId: post2.id,
    },
  });

  await prisma.reaction.createMany({
    data: [
      { authorId: alice.id, postId: post1.id, type: 'LIKE' },
      { authorId: charlie.id, postId: post1.id, type: 'CELEBRATE' },
      { authorId: bob.id, postId: post2.id, type: 'LOVE' },
      { authorId: charlie.id, postId: post2.id, type: 'LIKE' },
    ],
    skipDuplicates: true,
  });

  // Create notifications
  await prisma.notification.createMany({
    data: [
      { userId: bob.id, actorId: alice.id, type: 'LIKE', title: 'liked your post', link: `/posts/${post1.id}` },
      { userId: alice.id, actorId: bob.id, type: 'FOLLOW', title: 'started following you' },
      { userId: charlie.id, actorId: alice.id, type: 'FRIEND_REQUEST', title: 'sent you a friend request' },
    ],
  });

  // Create a group
  await prisma.group.create({
    data: {
      name: 'Web Developers',
      description: 'A community for web developers to share knowledge and collaborate.',
      visibility: 'PUBLIC',
      ownerId: bob.id,
      members: {
        create: [
          { userId: bob.id, role: 'ADMIN' },
          { userId: alice.id, role: 'MEMBER' },
          { userId: charlie.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Create messages
  await prisma.message.createMany({
    data: [
      { senderId: alice.id, receiverId: bob.id, content: 'Hey Bob! Love the new feature you built.' },
      { senderId: bob.id, receiverId: alice.id, content: 'Thanks Alice! It was a lot of work but worth it.' },
      { senderId: alice.id, receiverId: bob.id, content: 'Want to grab coffee this weekend and discuss the next sprint?' },
      { senderId: bob.id, receiverId: alice.id, content: 'Sounds great! How about Saturday at 2pm?' },
    ],
  });

  console.log('✅ Seed completed successfully!');
  console.log('   Demo accounts:');
  console.log('   - alice@example.com / Password123');
  console.log('   - bob@example.com / Password123');
  console.log('   - charlie@example.com / Password123');
  console.log('   - admin@vanzhub.com / Password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
