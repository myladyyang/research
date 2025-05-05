import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 清理现有数据（可选）
  await prisma.researchResult.deleteMany();
  await prisma.question.deleteMany();
  await prisma.source.deleteMany();
  await prisma.related.deleteMany();
  await prisma.research.deleteMany();
  await prisma.user.deleteMany();
  
  // 创建测试用户
  const password = await bcrypt.hash('password123', 10);
  const testUser = await prisma.user.create({
    data: {
      name: '测试用户',
      email: 'test@example.com',
      password: password,
    }
  });
  
  console.log(`创建测试用户: ${testUser.id}`);
  
  // 创建一个已完成的研究报告
  const completedResearch = await prisma.research.create({
    data: {
      title: "气候变化对农业产量的影响",
      isComplete: true,
      userId: testUser.id
    }
  });

  // 创建第一个问题
  const question1 = await prisma.question.create({
    data: {
      content: "气候变化如何影响全球农业产量?",
      model: "expert",
      userId: testUser.id,
      researchId: completedResearch.id
    }
  });

  // 为第一个问题创建结果
  await prisma.researchResult.create({
    data: {
      version: 1,
      markdownContent: "## 气候变化对农业产量的影响\n\n气候变化正在显著影响全球农业生产。研究表明，全球气温每升高1°C，全球粮食产量将下降约6%...",
      data: "## 气候变化与农业产量关系图\n\n```chart\n...",
      summary: "气候变化正在通过极端天气、季节变化和病虫害扩散等途径显著影响全球农业生产...",
      status: "complete",
      isComplete: true,
      progress: 100,
      questionId: question1.id,
      researchId: completedResearch.id
    }
  });

  // 创建第二个问题（跟进问题）
  const question2 = await prisma.question.create({
    data: {
      content: "请详细说明气候变化对不同区域农业的影响差异",
      model: "expert",
      userId: testUser.id,
      researchId: completedResearch.id
    }
  });

  // 为第二个问题创建结果
  await prisma.researchResult.create({
    data: {
      version: 2, // 版本递增
      markdownContent: "## 气候变化对农业产量的影响（区域差异详解）\n\n气候变化对全球农业系统造成了深远影响，但不同区域受影响程度各异...",
      data: "## 区域农业影响对比图\n\n```chart\n...",
      summary: "最新研究显示气候变化影响在区域上存在显著差异...",
      status: "complete",
      isComplete: true,
      progress: 100,
      questionId: question2.id,
      researchId: completedResearch.id
    }
  });
  
  // 添加参考来源
  await prisma.source.createMany({
    data: [
      {
        sourceId: "1",
        title: "气候变化对全球农业生产力的影响",
        url: "https://example.com/climate-agriculture-1",
        source: "气候研究期刊",
        researchId: completedResearch.id
      },
      {
        sourceId: "2",
        title: "温度上升与作物产量关系的元分析",
        url: "https://example.com/climate-agriculture-2",
        source: "农业科学期刊",
        researchId: completedResearch.id
      },
      {
        sourceId: "3",
        title: "气候适应性农业实践指南",
        url: "https://example.com/climate-agriculture-3",
        source: "联合国粮农组织",
        researchId: completedResearch.id
      }
    ]
  });
  
  // 添加相关研究
  await prisma.related.createMany({
    data: [
      {
        title: "气候变化对水资源的影响",
        url: "https://example.com/climate-water",
        date: "2023-05-15",
        description: "探讨气候变化如何影响全球水资源分布和可用性",
        researchId: completedResearch.id
      },
      {
        title: "抗旱作物品种培育进展",
        url: "https://example.com/drought-crops",
        date: "2023-06-20",
        description: "概述近年来抗旱作物品种培育的最新研究成果",
        researchId: completedResearch.id
      }
    ]
  });
  
  // 创建一个未完成的研究报告
  const incompleteResearch = await prisma.research.create({
    data: {
      title: "海平面上升对沿海城市的威胁",
      isComplete: false,
      userId: testUser.id, // 关联到测试用户
      questions: {
        create: {
          content: "海平面上升将如何影响全球主要沿海城市?",
          model: "research",
          userId: testUser.id, // 也关联问题到测试用户
        }
      }
    }
  });
  
  // 获取已创建的问题
  const incompleteQuestion = await prisma.question.findFirst({
    where: { researchId: incompleteResearch.id }
  });
  
  // 为未完成研究添加进行中的结果
  if (incompleteQuestion) {
    await prisma.researchResult.create({
      data: {
        version: 1,
        markdownContent: "## 海平面上升对沿海城市的威胁\n\n全球变暖导致的海平面上升正在成为沿海城市面临的重大挑战。\n\n### 当前趋势\n\n根据最新研究，全球平均海平面正以每年3.6毫米的速度上升，这一速率还在加快。",
        status: "正在分析数据...",
        isComplete: false,
        progress: 35,
        questionId: incompleteQuestion.id,
        researchId: incompleteResearch.id
      }
    });
  }
  
  // 添加部分参考来源
  await prisma.source.createMany({
    data: [
      {
        sourceId: "1",
        title: "全球海平面上升趋势报告",
        url: "https://example.com/sea-level-1",
        source: "气候变化研究所",
        researchId: incompleteResearch.id
      }
    ]
  });

  console.log(`创建完成的研究报告: ${completedResearch.id}`);
  console.log(`创建未完成的研究报告: ${incompleteResearch.id}`);
  console.log('数据库种子数据已成功添加');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });