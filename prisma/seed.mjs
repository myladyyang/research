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
  
  // 创建一个已完成的行业研究报告
  const completedResearch = await prisma.research.create({
    data: {
      title: "气候变化对农业产量的影响",
      userId: testUser.id,
      type: "INDUSTRY",
      mode: "RESEARCH",
      industryName: "农业",
      industryCategory: "第一产业",
      request: {
        title: "气候变化对农业产量的影响",
        question: "气候变化如何影响全球农业产量?",
        mode: "RESEARCH",
        type: "INDUSTRY",
        industryName: "农业",
        industryCategory: "第一产业",
        files: []
      },
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
      ],
      tasks: [
        {
          id: "t1",
          name: "数据收集",
          status: "completed",
          description: "收集全球农业产量历史数据"
        },
        {
          id: "t2",
          name: "模型分析",
          status: "completed",
          description: "分析气候变量与产量的相关性"
        }
      ]
    }
  });

  // 创建一个企业研究报告
  const corporateResearch = await prisma.research.create({
    data: {
      title: "宁德时代气候风险分析",
      userId: testUser.id,
      type: "CORPORATE",
      mode: "RESEARCH",
      companyName: "宁德时代",
      companyCode: "300750.SZ",
      industry: "新能源",
      request: {
        title: "宁德时代气候风险分析",
        question: "宁德时代面临哪些气候风险?",
        mode: "RESEARCH",
        type: "CORPORATE",
        companyName: "宁德时代",
        companyCode: "300750.SZ",
        industry: "新能源",
        files: []
      },
      related: [],
      files: []
    }
  });

  // 为未完成研究添加进行中的结果
  await prisma.researchResult.create({
    data: {
      version: 1,
      markdownContent: "## 宁德时代气候风险分析\n\n宁德时代作为全球领先的动力电池制造商，面临着多重气候风险挑战。\n\n### 主要风险\n\n1. 极端天气对供应链的影响\n2. 气候变化对原材料获取的影响\n3. 能源转型带来的机遇与挑战",
      status: "正在分析数据...",
      isComplete: false,
      researchId: corporateResearch.id,
      data: {},
      sources: [
        {
          id: "s6",
          sourceId: "6",
          title: "宁德时代2023年ESG报告",
          url: "https://example.com/catl-esg-2023",
          source: "宁德时代官网"
        }
      ],
      tasks: [
        {
          id: "t1",
          name: "数据收集",
          status: "in_progress",
          description: "收集宁德时代气候相关披露信息"
        }
      ]
    }
  });

  console.log(`创建行业研究报告: ${completedResearch.id}`);
  console.log(`创建企业研究报告: ${corporateResearch.id}`);
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