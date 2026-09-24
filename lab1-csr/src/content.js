export const posts = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  title: `文章标题 ${index + 1}`,
  body: `这是第 ${index + 1} 篇文章的正文内容……`
}));
