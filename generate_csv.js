const fs = require('fs');
const path = require('path');

const defaultData = [
  { word: "album", sentence: "I put my vacation photos in an album.", trans: "我把度假照片放進相簿裡。", meaning: "專輯；相簿" },
  { word: "anybody", sentence: "Did anybody see my pencil?", trans: "有人看到我的鉛筆嗎？", meaning: "任何人" },
  { word: "anything", sentence: "You can eat anything you like.", trans: "你可以吃你喜歡的任何東西。", meaning: "任何事物" },
  { word: "apartment", sentence: "We live in a small apartment in the city.", trans: "我們住在城市裡一間小公寓。", meaning: "公寓" },
  { word: "armadillo", sentence: "The armadillo has a hard shell to protect itself.", trans: "犰狳有堅硬的外殼來保護自己。", meaning: "犰狳" },
  { word: "belief", sentence: "She has a strong belief in kindness.", trans: "她深信善良的力量。", meaning: "信仰；信念" },
  { word: "blacktop", sentence: "The children played on the blacktop playground.", trans: "孩子們在柏油操場上玩耍。", meaning: "柏油路" },
  { word: "block", sentence: "Our school is one block away.", trans: "我們的學校在一個街區之外。", meaning: "街區；積木" },
  { word: "border", sentence: "The river forms the border between two countries.", trans: "那條河形成了兩國的邊界。", meaning: "邊界" },
  { word: "brake", sentence: "He pressed the brake to stop the car.", trans: "他踩煞車讓車停下來。", meaning: "煞車" },
  { word: "brave", sentence: "The brave firefighter saved the cat.", trans: "那位勇敢的消防員救了貓。", meaning: "勇敢的" },
  { word: "breathe", sentence: "Take a deep breath and relax.", trans: "深呼吸，放鬆一下。", meaning: "呼吸" },
  { word: "buffalo", sentence: "A buffalo is a large animal that lives on the grassland.", trans: "水牛是生活在草原上的大型動物。", meaning: "水牛" },
  { word: "bulldog", sentence: "The bulldog is strong but friendly.", trans: "鬥牛犬強壯但友善。", meaning: "鬥牛犬" },
  { word: "bulldozer", sentence: "The bulldozer cleared the land for new buildings.", trans: "推土機清理土地以建新建築。", meaning: "推土機" },
  { word: "burglar", sentence: "The burglar broke into the house at night.", trans: "竊賊在晚上闖入房子。", meaning: "竊賊" },
  { word: "button", sentence: "I lost a button on my shirt.", trans: "我的襯衫少了一顆鈕扣。", meaning: "鈕扣" },
  { word: "campfire", sentence: "We roasted marshmallows over the campfire.", trans: "我們在營火上烤棉花糖。", meaning: "營火" },
  { word: "cellar", sentence: "The old house has a dark cellar.", trans: "那棟老房子有個黑暗的地下室。", meaning: "地下室" },
  { word: "certainly", sentence: "I will certainly help you.", trans: "我當然會幫你。", meaning: "當然" },
  { word: "computer", sentence: "I use my computer to do homework.", trans: "我用電腦做功課。", meaning: "電腦" },
  { word: "country", sentence: "Japan is a beautiful country.", trans: "日本是一個美麗的國家。", meaning: "國家" },
  { word: "crocodile", sentence: "A crocodile lives near the river.", trans: "鱷魚住在河邊。", meaning: "鱷魚" },
  { word: "darkness", sentence: "He was afraid of the darkness.", trans: "他害怕黑暗。", meaning: "黑暗" },
  { word: "decide", sentence: "She can’t decide what to wear today.", trans: "她今天決定不了要穿什麼。", meaning: "決定" }
];

const part1 = [
  { word: "aboard", sentence: "All passengers are now aboard the plane.", trans: "所有乘客現在都登機了。", meaning: "在船（飛機、車）上" },
  { word: "advance", sentence: "The soldiers began to advance through the forest.", trans: "士兵們開始穿過森林向前推進。", meaning: "前進；進步" },
  { word: "affair", sentence: "The party was a grand affair with music and dancing.", trans: "這場聚會是個有音樂和舞蹈的盛大活動。", meaning: "事情；事件" },
  { word: "airfield", sentence: "Small planes land on the grassy airfield.", trans: "小型飛機降落在草地起降場上。", meaning: "小型機場；飛機場" },
  { word: "apply", sentence: "You should apply sunscreen before going outside.", trans: "出門前你應該塗防曬乳。", meaning: "塗抹；申請；應用" },
  { word: "attempt", sentence: "She made an attempt to climb the tall tree.", trans: "她嘗試爬上那棵高樹。", meaning: "嘗試；企圖" },
  { word: "attention", sentence: "Please pay attention to the teacher in class.", trans: "上課時請注意聽老師講課。", meaning: "注意力；專心" },
  { word: "basis", sentence: "Trust is the basis of good friendship.", trans: "信任是良好友誼的基礎。", meaning: "基礎；根據" },
  { word: "beautify", sentence: "We planted flowers to beautify our school garden.", trans: "我們種花來美化學校花園。", meaning: "美化；使美麗" },
  { word: "blueberry", sentence: "Mom baked a sweet blueberry pie for dessert.", trans: "媽媽烤了一個香甜的藍莓派當點心。", meaning: "藍莓" },
  { word: "branch", sentence: "A little bird is singing on the tree branch.", trans: "一隻小鳥在樹枝上唱歌。", meaning: "樹枝；分枝" },
  { word: "brook", sentence: "The clear water flows gently in the brook.", trans: "清澈的水在小溪裡緩緩流動。", meaning: "小溪；小河" },
  { word: "brownie", sentence: "He ate a delicious chocolate brownie after lunch.", trans: "他午餐後吃了一塊美味的巧克力布朗尼。", meaning: "布朗尼蛋糕" },
  { word: "bulb", sentence: "Dad changed the light bulb in my bedroom.", trans: "爸爸換了我臥室的燈泡。", meaning: "燈泡；球莖" },
  { word: "business", sentence: "My uncle runs a small bakery business.", trans: "我的叔叔經營一家小麵包店生意。", meaning: "商業；生意；事務" },
  { word: "capital", sentence: "Taipei is the capital city of Taiwan.", trans: "台北是台灣的首都。", meaning: "首都；大寫字母；資金" },
  { word: "cause", sentence: "Heavy rain can cause flooding in the streets.", trans: "大雨會導致街道淹水。", meaning: "引起；原因" },
  { word: "century", sentence: "This ancient castle was built a century ago.", trans: "這座古老的城堡是一百年前建造的。", meaning: "世紀；一百年" },
  { word: "chubby", sentence: "The baby has chubby cheeks and a cute smile.", trans: "那個小寶寶有著圓滾滾的臉頰和可愛的笑容。", meaning: "圓胖的；豐滿的" },
  { word: "closet", sentence: "I hang my jackets neatly in the closet.", trans: "我把外套整齊地掛在衣櫥裡。", meaning: "衣櫥；壁櫥" },
  { word: "coast", sentence: "We walked along the sandy coast and found seashells.", trans: "我們沿著沙灘海岸漫步並撿到了貝殼。", meaning: "海岸；海濱" },
  { word: "company", sentence: "Her mother works for a computer company.", trans: "她的媽媽在一間電腦公司上班。", meaning: "公司；陪伴" },
  { word: "continue", sentence: "Please continue reading the story from page ten.", trans: "請從第十頁繼續讀這個故事。", meaning: "繼續；持續" },
  { word: "craft", sentence: "We made paper lanterns in arts and crafts class.", trans: "我們在美勞課上製作了紙燈籠。", meaning: "手工藝；技藝" },
  { word: "crew", sentence: "The ship's crew worked hard to sail safely.", trans: "全體船員努力工作以安全航行。", meaning: "全體工作人員；船員；機組人員" }
];

const part2 = [
  { word: "crime", sentence: "Stealing is a serious crime that hurts others.", trans: "偷竊是一種傷害他人的嚴重犯罪行為。", meaning: "罪行；犯罪" },
  { word: "crop", sentence: "Corn is an important crop grown by farmers here.", trans: "玉米是這裡農夫種植的重要農作物。", meaning: "農作物；莊稼" },
  { word: "crowd", sentence: "A cheerful crowd cheered for the runners.", trans: "熱情的人群為跑者歡呼。", meaning: "人群；群眾" },
  { word: "dare", sentence: "He did not dare to jump into the cold water.", trans: "他不敢跳進冰冷的水裡。", meaning: "敢；膽敢" },
  { word: "disagree", sentence: "It is okay to disagree as long as we are polite.", trans: "只要我們有禮貌，意見不同也是沒關係的。", meaning: "不同意；意見不合" },
  { word: "dresser", sentence: "She keeps her socks and t-shirts in the dresser.", trans: "她把襪子和T恤收在梳妝台衣櫃裡。", meaning: "梳妝台；矮衣櫃" },
  { word: "drift", sentence: "Leaves drift slowly down the quiet river.", trans: "樹葉在平靜的小河上緩緩漂流。", meaning: "漂流；漂移" },
  { word: "elevator", sentence: "We took the elevator to the tenth floor.", trans: "我們搭電梯到十樓。", meaning: "電梯" },
  { word: "everywhere", sentence: "In spring, colorful flowers bloom everywhere.", trans: "春天時，到處都盛開著繽紛的花朵。", meaning: "到處；處處" },
  { word: "expect", sentence: "We expect sunny weather for our picnic tomorrow.", trans: "我們期盼明天的野餐會是晴天。", meaning: "預期；期待" },
  { word: "explain", sentence: "Can you explain how to solve this math problem?", trans: "你能解釋一下如何解這道數學題嗎？", meaning: "解釋；說明" },
  { word: "famous", sentence: "The Eiffel Tower is a famous landmark in Paris.", trans: "艾菲爾鐵塔是巴黎著名的地標。", meaning: "著名的；出名的" },
  { word: "figure", sentence: "I saw a shadowy figure standing in the doorway.", trans: "我看見一個模糊的身影站在門口。", meaning: "身影；身材；數字；圖形" },
  { word: "fitting", sentence: "A warm coat is fitting for a cold winter day.", trans: "一件暖和的外套適合寒冷的冬日穿著。", meaning: "合適的；恰當的" },
  { word: "flaw", sentence: "The diamond has a tiny flaw, but it still sparkles.", trans: "這顆鑽石有個微小的瑕疵，但依然閃閃發光。", meaning: "瑕疵；缺點" },
  { word: "flood", sentence: "The river overflowed and caused a flood in the village.", trans: "河水暴漲，導致村莊發生水災。", meaning: "水災；洪水" },
  { word: "forth", sentence: "The little swing moved back and forth in the wind.", trans: "小鞦韆在風中前後擺動。", meaning: "向前；向外" },
  { word: "friendship", sentence: "Their friendship grew stronger over the school years.", trans: "經過這些學年，他們的友誼更加深厚了。", meaning: "友誼；友情" },
  { word: "gale", sentence: "The strong gale blew hats off people's heads.", trans: "強勁的大風把人們頭上的帽子吹跑了。", meaning: "強風；大風" },
  { word: "gallon", sentence: "Mom bought a gallon of fresh milk at the store.", trans: "媽媽在商店買了一加侖的新鮮牛奶。", meaning: "加侖（容量單位）" },
  { word: "general", sentence: "The general led his army with great courage.", trans: "將軍以無比的勇氣率領他的軍隊。", meaning: "將軍；一般的；普遍的" },
  { word: "hale", sentence: "My grandfather is eighty years old, yet still hale and healthy.", trans: "我爺爺八十歲了，但身體依然健壯硬朗。", meaning: "健壯的；矍鑠的" },
  { word: "handle", sentence: "Turn the door handle gently to open the door.", trans: "輕輕轉動門把來打開門。", meaning: "把手；處理" },
  { word: "haste", sentence: "In his haste to catch the bus, he dropped his bag.", trans: "在他匆忙趕公車時，他不小心把書包掉了。", meaning: "匆忙；倉促" },
  { word: "hunger", sentence: "After a long hike, the boys felt great hunger.", trans: "長途健行後，男孩們感到非常飢餓。", meaning: "飢餓；渴望" }
];

const part3 = [
  { word: "invent", sentence: "Thomas Edison helped invent the electric light bulb.", trans: "愛迪生協助發明了電燈泡。", meaning: "發明；創造" },
  { word: "jingle", sentence: "The keys jingle in my pocket when I run.", trans: "當我跑步時，口袋裡的鑰匙發出叮噹聲。", meaning: "叮噹響；短歌；短曲" },
  { word: "kilogram", sentence: "A bag of flour weighs about one kilogram.", trans: "一袋麵粉大約重一公斤。", meaning: "公斤" },
  { word: "kilometer", sentence: "We walked one kilometer around the park.", trans: "我們繞著公園走了一公里。", meaning: "公里" },
  { word: "lawn", sentence: "Dad mowed the green lawn in the front yard.", trans: "爸爸修剪了前院的綠色草坪。", meaning: "草坪；草地" },
  { word: "length", sentence: "The swimmer swam the entire length of the pool.", trans: "游泳選手游完了整座泳池的長度。", meaning: "長度" },
  { word: "lord", sentence: "The medieval lord lived in a magnificent castle.", trans: "中世紀的領主住在一座壯麗的城堡裡。", meaning: "領主；貴族；主人" },
  { word: "malt", sentence: "Malt is used to make cereal and yummy drinks.", trans: "麥芽可用來製作穀麥食品和美味飲料。", meaning: "麥芽" },
  { word: "meek", sentence: "The meek little rabbit hid quietly under the bush.", trans: "那隻溫順的小兔子安靜地躲在灌木叢下。", meaning: "溫順的；謙恭的" },
  { word: "method", sentence: "She discovered an easy method to memorize words.", trans: "她發現了一個背單字的簡單方法。", meaning: "方法；辦法" },
  { word: "modern", sentence: "The new library has many modern computers.", trans: "新圖書館裡有許多現代化的電腦。", meaning: "現代的；新式的" },
  { word: "mount", sentence: "The rider will mount the brown horse.", trans: "騎士準備騎上那匹棕色的馬。", meaning: "登上；騎上；山峰" },
  { word: "natural", sentence: "Honey is a natural sweetener made by bees.", trans: "蜂蜜是由蜜蜂製造的天然甜味劑。", meaning: "天然的；自然的" },
  { word: "neighbor", sentence: "Our friendly neighbor waved hello across the fence.", trans: "我們友善的鄰居越過籬笆向我們揮手問好。", meaning: "鄰居" },
  { word: "objective", sentence: "Our main objective is to finish the project on time.", trans: "我們的主要目標是準時完成專案。", meaning: "目標；客觀的" },
  { word: "parade", sentence: "We watched the marching band in the holiday parade.", trans: "我們在節慶遊行中觀看樂旗隊表演。", meaning: "遊行；閱兵" },
  { word: "pitch", sentence: "The pitcher threw a fastball pitch to the batter.", trans: "投手向打擊者投出了一記快速球。", meaning: "投球；瀝青；音高" },
  { word: "plentiful", sentence: "Apples are plentiful in the orchard during autumn.", trans: "秋天時果園裡的蘋果非常豐富充足。", meaning: "豐富的；充足的" },
  { word: "position", sentence: "The goalkeeper moved into position before the kick.", trans: "守門員在球被踢出前就定位了。", meaning: "位置；姿勢；職位" },
  { word: "produce", sentence: "Bees produce sweet honey in their hives.", trans: "蜜蜂在蜂巢裡生產香甜的蜂蜜。", meaning: "生產；製造；農產品" },
  { word: "raindrops", sentence: "Cool raindrops began to patter on the window.", trans: "冰涼的雨滴開始滴滴答答落在窗戶上。", meaning: "雨滴；雨點" },
  { word: "refrigerator", sentence: "Please put the milk back into the refrigerator.", trans: "請把牛奶放回冰箱裡。", meaning: "冰箱" },
  { word: "refuse", sentence: "He had to refuse the invitation because he was sick.", trans: "他因為生病而不得不拒絕這份邀請。", meaning: "拒絕" },
  { word: "respect", sentence: "We should always show respect to our elders.", trans: "我們應該時常對長輩展現尊敬。", meaning: "尊敬；尊重" },
  { word: "slide", sentence: "The children love to slide down the playground slide.", trans: "孩子們喜歡在遊樂場的溜滑梯上滑下來。", meaning: "滑動；溜滑梯" }
];

const part4 = [
  { word: "smooth", sentence: "The polished stone felt cool and smooth in my hand.", trans: "磨光的石頭在我手中感覺冰涼且平滑。", meaning: "平滑的；光滑的" },
  { word: "special", sentence: "Today is a special day because it is my birthday.", trans: "今天是個特別的日子，因為是我的生日。", meaning: "特別的；特殊的" },
  { word: "spirit", sentence: "The soccer team played with energetic team spirit.", trans: "足球隊帶著充沛的團隊精神比賽。", meaning: "精神；靈魂；氣魄" },
  { word: "spread", sentence: "She used a butter knife to spread jam on toast.", trans: "她用奶油刀在吐司上抹果醬。", meaning: "塗抹；展開；傳播" },
  { word: "stink", sentence: "Rotten eggs produce a terrible stink.", trans: "腐爛的蛋會散發可怕的臭味。", meaning: "發出臭味；惡臭" },
  { word: "stomach", sentence: "Eating too much candy gave him a stomach ache.", trans: "吃太多糖果讓他胃痛肚子痛。", meaning: "胃；肚子" },
  { word: "strike", sentence: "Lightning can strike tall trees during a thunderstorm.", trans: "雷雨時閃電可能會擊中高大的樹木。", meaning: "擊打；襲擊；罷工" },
  { word: "suggest", sentence: "I suggest we read a book while waiting.", trans: "我建議我們在等待的時候看本書。", meaning: "建議；提議" },
  { word: "suntan", sentence: "He got a golden suntan after spending the day at the beach.", trans: "在海灘度過一天後，他曬出了金黃的古銅色肌膚。", meaning: "曬黑；曬成棕褐色的皮膚" },
  { word: "suppose", sentence: "I suppose we should leave now before it starts raining.", trans: "我想我們應該在下雨前現在就出發。", meaning: "猜想；以為；假定" },
  { word: "sweetness", sentence: "The natural sweetness of ripe watermelon is delightful.", trans: "熟透西瓜的天然甜味令人心情愉悅。", meaning: "甜味；芳香；溫柔" },
  { word: "system", sentence: "The planets travel around the sun in the solar system.", trans: "太陽系中的行星繞著太陽運轉。", meaning: "系統；體制" },
  { word: "talent", sentence: "She has a wonderful talent for playing the piano.", trans: "她很有彈鋼琴的才華。", meaning: "天賦；才華" },
  { word: "taught", sentence: "Our teacher taught us how to draw funny cartoons.", trans: "我們的老師教我們如何畫有趣的卡通漫畫。", meaning: "教導（teach 的過去式）" },
  { word: "teaspoon", sentence: "Add one teaspoon of sugar into your warm tea.", trans: "在溫茶裡加入一茶匙的糖。", meaning: "茶匙；一茶匙的量" },
  { word: "toothpaste", sentence: "Squeeze a little toothpaste onto your toothbrush.", trans: "擠一點牙膏在你的牙刷上。", meaning: "牙膏" },
  { word: "trend", sentence: "Wearing colorful sneakers is a popular fashion trend.", trans: "穿彩色球鞋是一種流行的時尚趨勢。", meaning: "趨勢；潮流" },
  { word: "trio", sentence: "The trio of musicians played sweet violin melodies.", trans: "這三人音樂組演奏了悠揚的小提琴旋律。", meaning: "三人組；三重奏" },
  { word: "tulip", sentence: "A bright yellow tulip bloomed in the spring sun.", trans: "一朵亮黃色的鬱金香在春陽下盛開。", meaning: "鬱金香" },
  { word: "useless", sentence: "An umbrella with holes is useless in heavy rain.", trans: "破了洞的雨傘在大雨中是毫無用處的。", meaning: "無用的；無效的" },
  { word: "vacation", sentence: "Our family went to the beach during summer vacation.", trans: "暑假期間我們全家去了海灘度假。", meaning: "假期；度假" },
  { word: "valley", sentence: "A quiet village lies peacefully between the green valley.", trans: "一座安靜的村莊座落在綠意盎然的山谷之間。", meaning: "山谷；溪谷" },
  { word: "woodpecker", sentence: "The woodpecker used its sharp beak to peck the tree trunk.", trans: "啄木鳥用牠尖銳的鳥喙啄著樹幹。", meaning: "啄木鳥" },
  { word: "yank", sentence: "Give the rope a firm yank to ring the bell.", trans: "用力猛拉一下繩子來敲鐘。", meaning: "猛拉；急抽" },
  { word: "yeast", sentence: "Bakers use yeast to make dough rise into fluffy bread.", trans: "烘焙師使用酵母讓麵團發酵成蓬鬆的麵包。", meaning: "酵母；酵母菌" }
];

// 逐行隔離解析 CSV
function parseCSVText(text) {
  const cleanText = text.replace(/^\uFEFF/, '');
  const lines = cleanText.split(/\r?\n/);
  if (lines.length === 0) return [];

  const result = [];
  let startIndex = 0;
  const firstCol = lines[0].split(/[,\t]/)[0].trim().replace(/^"|"$/g, '').toLowerCase();
  if (firstCol === 'word' || firstCol === 'words' || firstCol === '單字' || firstCol === '英文單字') {
    startIndex = 1;
  }

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let parts = [];
    if (line.includes('\t') && !line.includes(',')) {
      parts = line.split('\t').map(s => s.trim().replace(/^"|"$/g, ''));
    } else {
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          if (inQuotes && line[j + 1] === '"') {
            current += '"';
            j++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          parts.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      parts.push(current);
      parts = parts.map(p => p.trim().replace(/^"|"$/g, ''));
    }

    if (parts.length > 0 && parts[0]) {
      if (parts.length === 2) {
        result.push({ word: parts[0], sentence: "", trans: "", meaning: parts[1] || "" });
      } else if (parts.length === 3) {
        result.push({ word: parts[0], sentence: parts[1] || "", trans: "", meaning: parts[2] || "" });
      } else {
        result.push({
          word: parts[0] || "",
          sentence: parts[1] || "",
          trans: parts[2] || "",
          meaning: parts[3] || ""
        });
      }
    }
  }
  return result;
}

function toCSV(items) {
  const header = "word,sentence,trans,meaning";
  const rows = items.map(item => {
    const w = `"${(item.word || '').replace(/"/g, '""')}"`;
    const s = `"${(item.sentence || '').replace(/"/g, '""')}"`;
    const t = `"${(item.trans || '').replace(/"/g, '""')}"`;
    const m = `"${(item.meaning || '').replace(/"/g, '""')}"`;
    return `${w},${s},${t},${m}`;
  });
  return [header, ...rows].join("\r\n");
}

// 寫出預設 CSV 檔案
fs.writeFileSync(path.join(__dirname, '2026_Spelling_Bee_Part1.csv'), "\ufeff" + toCSV(part1), 'utf8');
fs.writeFileSync(path.join(__dirname, '2026_Spelling_Bee_Part2.csv'), "\ufeff" + toCSV(part2), 'utf8');
fs.writeFileSync(path.join(__dirname, '2026_Spelling_Bee_Part3.csv'), "\ufeff" + toCSV(part3), 'utf8');
fs.writeFileSync(path.join(__dirname, '2026_Spelling_Bee_Part4.csv'), "\ufeff" + toCSV(part4), 'utf8');

const allWords = [...part1, ...part2, ...part3, ...part4];
fs.writeFileSync(path.join(__dirname, '2026_Spelling_Bee_All.csv'), "\ufeff" + toCSV(allWords), 'utf8');

// 自動掃描目錄下其他 CSV 題庫並同步至 HTML 內建題庫 (若執行 node generate_csv.js --sync)
function syncHtmlDatabase() {
  const htmlFiles = ['index.html', 'Engligh_v3.html'];
  const presetBanksObj = {
    "2026_Part1": { name: "🐝 2026 Part 1 (25字)", data: part1 },
    "2026_Part2": { name: "🐝 2026 Part 2 (25字)", data: part2 },
    "2026_Part3": { name: "🐝 2026 Part 3 (25字)", data: part3 },
    "2026_Part4": { name: "🐝 2026 Part 4 (25字)", data: part4 },
    "2026_All": { name: "🌟 2026 全部單字 (100字)", data: allWords },
    "default": { name: "📚 Grade 1C 原題庫 (25字)", data: defaultData }
  };

  const ignoreFiles = new Set([
    '2026_Spelling_Bee_Part1.csv',
    '2026_Spelling_Bee_Part2.csv',
    '2026_Spelling_Bee_Part3.csv',
    '2026_Spelling_Bee_Part4.csv',
    '2026_Spelling_Bee_All.csv',
    'test_words.csv'
  ]);

  // 掃描專案根目錄與 wordbanks/（photo_to_csv.js 的預設輸出資料夾）
  const scanDirs = [__dirname, path.join(__dirname, 'wordbanks')].filter(d => fs.existsSync(d));
  const files = [];
  for (const dir of scanDirs) {
    fs.readdirSync(dir)
      .filter(f => f.toLowerCase().endsWith('.csv') && !ignoreFiles.has(f))
      .forEach(f => files.push(path.join(dir, f)));
  }
  for (const filePath of files) {
    const file = path.basename(filePath);
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = parseCSVText(content);
      if (parsed.length > 0) {
        const key = path.basename(file, path.extname(file));
        let displayName = `📘 ${key} (${parsed.length}字)`;
        const m = key.match(/^Grade2B_Week0?(\d+)$/i);
        if (m) {
          displayName = `📘 Grade 2B - Week ${m[1]} (${parsed.length}字)`;
        } else if (key === 'Grade2B_All') {
          displayName = `🌟 Grade 2B 全部單字 (${parsed.length}字)`;
        }
        presetBanksObj[key] = {
          name: displayName,
          data: parsed
        };
      }
    } catch (e) {
      console.warn(`略過無法解析的 CSV: ${file}`, e.message);
    }
  }

  for (const htmlFile of htmlFiles) {
    const fullPath = path.join(__dirname, htmlFile);
    if (!fs.existsSync(fullPath)) continue;
    let html = fs.readFileSync(fullPath, 'utf8');
    const markerStart = '// --- BEGIN_PRESET_BANKS ---';
    const markerEnd = '// --- END_PRESET_BANKS ---';
    if (html.includes(markerStart) && html.includes(markerEnd)) {
      const replacement = `${markerStart}\n        const presetBanks = ${JSON.stringify(presetBanksObj, null, 12)};\n        ${markerEnd}`;
      const regex = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`);
      html = html.replace(regex, replacement);
      fs.writeFileSync(fullPath, html, 'utf8');
      console.log(`已同步更新 ${htmlFile} 內建題庫！`);
    }
  }
}

if (require.main === module) {
  syncHtmlDatabase();
}

module.exports = { defaultData, part1, part2, part3, part4, allWords, parseCSVText, toCSV, syncHtmlDatabase };
