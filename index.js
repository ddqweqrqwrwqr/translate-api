const express = require('express');
const { translate, detect,lang, getLanguages } = require('bing-translate-api');
const app = express();
const port = process.env.PORT || 3000;

// 解析JSON请求体
app.use(express.json());

// 允许跨域请求
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

/**
 * 获取请求参数（兼容GET和POST）
 * @param {Object} req - Express请求对象
 * @returns {Object} 合并后的请求参数
 */
const getParams = (req) => {
  // GET参数在query中，POST参数在body中
  return { ...req.query, ...req.body };
};

/**
 * 翻译API端点
 * 支持GET和POST
 * 参数:
 * - text: 要翻译的文本
 * - from: 源语言代码（默认自动检测）
 * - to: 目标语言代码（默认'en'）
 */
app.route('/translate')
  .get(async (req, res) => {
    try {
      const { text, from = 'auto-detect', to = 'en' } = getParams(req);
      
      if (!text) {
        return res.status(400).json({ error: '请提供要翻译的文本' });
      }
      
      const result = await translate(text, from, to, false);
      res.json(result);
    } catch (error) {
      console.error('翻译错误:', error);
      res.status(500).json({ error: '翻译服务出错', details: error.message });
    }
  })
  .post(async (req, res) => {
    try {
      const { text, from = 'auto-detect', to = 'en' } = getParams(req);
      
      if (!text) {
        return res.status(400).json({ error: '请提供要翻译的文本' });
      }
      
      const result = await translate(text, from, to, false);
      res.json(result);
    } catch (error) {
      console.error('翻译错误:', error);
      res.status(500).json({ error: '翻译服务出错', details: error.message });
    }
  });






/**
 * 批量翻译API端点
 * 仅支持POST（更适合处理数组和长文本）
 * 参数:
 * - texts: 要翻译的文本数组（必填）
 * - from: 源语言代码（默认自动检测）
 * - to: 目标语言代码（默认'en'）
 */
app.post('/translate/batch', async (req, res) => {
  try {
    const {  from = 'auto-detect',  } = req.body;
    var to = req.body.to || 'zh-Hans'
    if(to=='zh-CN'){
        to='zh-Hans'
    }
    
    var texts = req.body.texts;
    
    console.log('body ',typeof texts,JSON.stringify(req.body));
    if(typeof texts=='string'){
        texts = JSON.parse(texts);    
        console.log(texts);
    }
    
    
    // 验证输入
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: '请提供有效的文本数组（texts）' });
    }
    
    // 检查数组元素是否都是字符串
    if (!texts.every(text => typeof text === 'string')) {
      return res.status(400).json({ error: '文本数组必须包含字符串元素' });
    }
    
    // 并发处理所有翻译请求
    const results = await Promise.all(
      texts.map(async (text, index) => {
        try {
          const result = await translate(text, from, to, false);
          return {
            index,
            original: text,
            translated: result.translation,
            result
          };
        } catch (error) {
          return {
            index,
            original: text,
            error: error.message
          };
        }
      })
    );
    
    res.json({
      count: texts.length,
      success: results.filter(r => !r.error).length,
      failed: results.filter(r => r.error).length,
      results
    });
  } catch (error) {
    console.error('批量翻译错误:', error);
    res.status(500).json({ error: '批量翻译服务出错', details: error.message });
  }
});

/**
 * 语言检测API端点
 * 支持GET和POST
 * 参数:
 * - text: 要检测语言的文本
 */
app.route('/detect')
  .get(async (req, res) => {
    try {
      const { text } = getParams(req);
      
      if (!text) {
        return res.status(400).json({ error: '请提供要检测语言的文本' });
      }
      
      const result = await detect(text);
      res.json(result);
    } catch (error) {
      console.error('语言检测错误:', error);
      res.status(500).json({ error: '语言检测服务出错', details: error.message });
    }
  })
  .post(async (req, res) => {
    try {
      const { text } = getParams(req);
      
      if (!text) {
        return res.status(400).json({ error: '请提供要检测语言的文本' });
      }
      
      const result = await detect(text);
      res.json(result);
    } catch (error) {
      console.error('语言检测错误:', error);
      res.status(500).json({ error: '语言检测服务出错', details: error.message });
    }
  });

/**
 * 获取支持的语言列表API端点
 * 支持GET和POST
 */
app.route('/languages')
  .get(async (req, res) => {
    try {
        
      //const languages = await getLanguages();
      res.json(lang.LANGS);
    } catch (error) {
      console.error('获取语言列表错误:', error);
      res.status(500).json({ error: '获取语言列表出错', details: error.message });
    }
  })
  .post(async (req, res) => {
    try {
      //const languages = await getLanguages();
      //res.json(languages);
      res.json(lang.LANGS);
    } catch (error) {
      console.error('获取语言列表错误:', error);
      res.status(500).json({ error: '获取语言列表出错', details: error.message });
    }
  });

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: 'Bing Translate API 服务',
    endpoints: {
      '/translate': 'GET/POST - 翻译单个文本',
      '/translate/batch': 'POST - 批量翻译多个文本',
      '/detect': 'GET/POST - 检测语言',
      '/languages': 'GET/POST - 获取支持的语言列表'
    },
    参数说明: {
      translate: {
        text: '要翻译的文本（必填）',
        from: '源语言代码（可选，默认自动检测）',
        to: '目标语言代码（可选，默认\'en\'）'
      },
      'translate/batch': {
        texts: '要翻译的文本数组（必填，例如: ["text1", "text2"]）',
        from: '源语言代码（可选，默认自动检测）',
        to: '目标语言代码（可选，默认\'en\'）'
      },
      detect: {
        text: '要检测语言的文本（必填）'
      }
    }
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`Bing Translate API 服务运行在 http://localhost:${port}`);
});
    