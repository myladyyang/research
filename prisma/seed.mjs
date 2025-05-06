import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 清理现有数据
  await prisma.researchResult.deleteMany();
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
      userId: testUser.id,
      // 使用JSON字段存储问题
      question: {
        question: "气候变化如何影响全球农业产量?",
        model: "expert",
        files: [],
        id: "q1",
        createdAt: new Date().toISOString()
      },
      // 使用JSON字段存储相关研究
      related: [
        {
          id: "r1",
          title: "气候变化对水资源的影响",
          url: "https://example.com/climate-water",
          date: "2023-05-15",
          description: "探讨气候变化如何影响全球水资源分布和可用性"
        },
        {
          id: "r2",
          title: "抗旱作物品种培育进展",
          url: "https://example.com/drought-crops",
          date: "2023-06-20",
          description: "概述近年来抗旱作物品种培育的最新研究成果"
        }
      ],
      // 使用JSON字段存储文件
      files: []
    }
  });

  // 为研究创建第一个结果
  await prisma.researchResult.create({
    data: {
      version: 1,
      markdownContent: "## 气候变化对农业产量的影响\n\n气候变化正在显著影响全球农业生产。研究表明，全球气温每升高1°C，全球粮食产量将下降约6%...",
      summary: "气候变化正在通过极端天气、季节变化和病虫害扩散等途径显著影响全球农业生产...",
      status: "complete",
      isComplete: true,
      researchId: completedResearch.id,
      // 使用JSON字段存储数据可视化内容
      data: {
        charts: [
          {
            type: "line",
            title: "气候变化与农业产量关系图",
            data: {
              labels: ["1980", "1990", "2000", "2010", "2020"],
              datasets: [
                {
                  label: "全球农业产量指数",
                  data: [100, 105, 103, 98, 92]
                }
              ]
            }
          }
        ],
        tables: [
          {
            title: "不同作物对气候变化的敏感性",
            headers: ["作物", "温度敏感性", "水分敏感性"],
            rows: [
              ["小麦", "高", "中"],
              ["玉米", "中", "高"],
              ["水稻", "中", "高"]
            ]
          }
        ]
      },
      // 使用JSON字段存储来源
      sources: [
        {
          id: "s1",
          sourceId: "1",
          title: "气候变化对全球农业生产力的影响",
          url: "https://example.com/climate-agriculture-1",
          source: "气候研究期刊"
        },
        {
          id: "s2",
          sourceId: "2",
          title: "温度上升与作物产量关系的元分析",
          url: "https://example.com/climate-agriculture-2",
          source: "农业科学期刊"
        },
        {
          id: "s3",
          sourceId: "3",
          title: "气候适应性农业实践指南",
          url: "https://example.com/climate-agriculture-3",
          source: "联合国粮农组织"
        }
      ]
    }
  });

  // 为研究创建第二个结果（对应跟进问题）
  await prisma.researchResult.create({
    data: {
      version: 2, // 版本递增
      markdownContent: "## 气候变化对农业产量的影响（区域差异详解）\n\n气候变化对全球农业系统造成了深远影响，但不同区域受影响程度各异...",
      summary: "最新研究显示气候变化影响在区域上存在显著差异...",
      status: "complete",
      isComplete: true,
      researchId: completedResearch.id,
      // 使用JSON字段存储数据可视化内容
      data: {
        charts: [
          {
            type: "bar",
            title: "区域农业影响对比图",
            data: {
              labels: ["亚洲", "非洲", "欧洲", "北美", "南美", "大洋洲"],
              datasets: [
                {
                  label: "气候变化影响程度 (%)",
                  data: [-12, -15, -4, -6, -10, -8]
                }
              ]
            }
          }
        ]
      },
      // 使用JSON字段存储来源
      sources: [
        {
          id: "s4",
          sourceId: "4",
          title: "区域气候模型与农业生产关系研究",
          url: "https://example.com/regional-climate-models",
          source: "区域气候研究中心"
        },
        {
          id: "s5",
          sourceId: "5",
          title: "气候变化对亚洲水稻产量的影响",
          url: "https://example.com/asia-rice-production",
          source: "亚洲农业科学期刊"
        }
      ]
    }
  });
  
  // 创建一个未完成的研究报告
  const incompleteResearch = await prisma.research.create({
    data: {
      title: "海平面上升对沿海城市的威胁",
      userId: testUser.id,
      // 使用JSON字段存储问题
      question: {
        question: "海平面上升将如何影响全球主要沿海城市?",
        model: "research",
        files: [],
        id: "q2",
        createdAt: new Date().toISOString()
      },
      // 使用JSON字段存储相关研究，空数组
      related: [],
      // 使用JSON字段存储文件，空数组
      files: []
    }
  });
  
  // 为未完成研究添加进行中的结果
  await prisma.researchResult.create({
    data: {
      version: 1,
      markdownContent: "## 海平面上升对沿海城市的威胁\n\n全球变暖导致的海平面上升正在成为沿海城市面临的重大挑战。\n\n### 当前趋势\n\n根据最新研究，全球平均海平面正以每年3.6毫米的速度上升，这一速率还在加快。",
      status: "正在分析数据...",
      isComplete: false,
      researchId: incompleteResearch.id,
      // 使用JSON字段存储数据可视化内容，空对象
      data: {},
      // 使用JSON字段存储来源
      sources: [
        {
          id: "s6",
          sourceId: "6",
          title: "全球海平面上升趋势报告",
          url: "https://example.com/sea-level-1",
          source: "气候变化研究所"
        }
      ]
    }
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