(() => {
  const order = ['happy', 'okay', 'sad', 'anxious', 'tired', 'overwhelmed', 'unmotivated', 'lonely'];
  // Each topic has a different response for each of the eight moods.
  const messages = {
    english: {
      school: [
        'With school as part of your happiness, notice the learning, effort, or connection that made today meaningful. You can celebrate before setting another goal.',
        'With studies on your mind, one manageable task can give an ordinary day some direction. There is no need to fill every free moment with schoolwork.',
        'If something at school has hurt or disappointed you, it deserves a little room. A difficult experience at school cannot describe everything you are capable of.',
        'When school is making you anxious, separate the next real task from all the outcomes you are imagining. Ask a teacher or classmate about the part that feels unclear.',
        'Schoolwork can ask a lot when your energy is already low. Choose the most essential part, take a pause, and ask what can reasonably wait.',
        'When school feels like too much, list the actual deadlines and choose one small part to start. You can ask for help deciding what needs attention first.',
        'If studying feels difficult to start, open just one page or work through one example. You are allowed to begin before you feel enthusiastic about the whole subject.',
        'Feeling lonely at school can make even a busy classroom feel distant. A small conversation with a classmate or a shared study session may be a gentler starting point than trying to fit in everywhere.'
      ],
      work: [
        'If work contributed to your happiness, recognize what went well and the part you played. Enjoying a good result does not require immediately taking on more responsibility.',
        'With work as part of your day, a realistic stopping point can help you keep some balance. Your life outside your tasks deserves attention, too.',
        'A disappointing experience at work can hurt without defining your ability. Give yourself time before turning one outcome into a judgment about your whole future.',
        'When work is making you nervous, clarify what is expected instead of trying to predict every reaction. A specific question can be more useful than another round of guessing.',
        'If work is part of your tiredness, choose a realistic stopping point. You can explain your capacity and ask what should take priority instead of giving every task your last bit of energy.',
        'When work feels overloaded, identify what is urgent, what can wait, and what can be shared. A workload that exceeds your capacity needs a clearer plan, not more blame toward yourself.',
        'If work feels hard to begin, make the first task concrete and small. Opening the file or drafting a rough sentence can be enough to get started without promising a perfect result.',
        'Loneliness at work can exist even with people around you. A short conversation or a break with someone approachable can be a small way to find connection without forcing closeness.'
      ],
      family: [
        'If family helped you feel happy, tell them about the moment you appreciated. A small expression of gratitude can give that good experience somewhere to land.',
        'With family on your mind, consider whether you want some company or a little space today. Either need can fit an ordinary, quiet day.',
        'Sadness involving family can feel especially close to the heart. You can acknowledge the hurt and choose a trusted person to talk with without needing to resolve everything today.',
        'If family matters are making you anxious, focus on one conversation or action that is actually yours to take. Other people’s reactions are not entirely yours to control.',
        'Family matters can take energy, whether you need help, company, or some space. Choose one need you can express today without taking on every family concern at once.',
        'When family needs feel overwhelming, say what you can realistically give and where you need help. Having limits does not erase your care for them.',
        'If family concerns are making it hard to get going, start with one manageable responsibility. You do not need to carry every expectation before taking care of your own day.',
        'Feeling lonely in your family does not make the feeling less real. If it feels comfortable, tell someone what kind of company or listening you would appreciate.'
      ],
      relationships: [
        'If a friend or someone close made you happy, let them know what you valued. You can enjoy the connection without needing a special occasion to express it.',
        'With a friendship or relationship on your mind, a simple check-in can be enough today. Connection does not always need an exciting plan or a long conversation.',
        'When another person is part of your sadness, you can care about them and still recognize your own hurt. Give yourself time to decide what you need before starting a difficult conversation.',
        'If you are anxious about a friendship or relationship, separate what you know from what you are guessing. When appropriate, ask for clarity instead of deciding what another person must be thinking.',
        'If a friendship or relationship is leaving you tired, you can ask for a pause. Being caring does not require being available for every conversation at every moment.',
        'When a relationship feels overwhelming, focus on one concern at a time. You can state a need or a boundary without solving the entire relationship in one sitting.',
        'If a relationship concern is taking your motivation, choose one small action that looks after you. You can return to the conversation when you have more room for it.',
        'If you feel distant from someone, a small honest invitation can give connection a chance. You can ask to talk without having to explain your loneliness perfectly.'
      ],
      self: [
        'If something about yourself made you happy today, let yourself recognize it. Your growth and your enjoyment can matter even when nobody else sees them.',
        'If you are checking in with yourself, an ordinary mood does not need fixing. Notice one need you can meet without demanding a different version of yourself.',
        'When sadness turns into criticism of yourself, separate the feeling from your whole identity. You can acknowledge something difficult without deciding you are a disappointment.',
        'If you are worried about your own ability or future, bring the question back to one thing you can try. Uncertainty is not evidence that you will fail.',
        'If you have been pushing yourself hard, make today’s expectations fit the energy you actually have. Rest does not take away the effort you have already given.',
        'If your own expectations feel overwhelming, choose which one genuinely matters today. You are allowed to make a smaller plan rather than treating every wish as an urgent demand.',
        'If you are judging yourself for having no motivation, try curiosity before criticism. A small, realistic beginning can be more helpful than another promise to completely change overnight.',
        'If you feel alone with your thoughts, you do not have to make yourself easier to love before reaching out. You can seek company as the person you are today.'
      ],
      change: [
        'If a change brought you happiness, enjoy discovering what feels good about it. You do not have to map the whole future to appreciate this beginning.',
        'With a change in your life, it is fine to simply observe how you are settling in. You can build familiarity one ordinary day at a time.',
        'A change can bring sadness even when parts of it were wanted. Give yourself room to miss what was familiar while you find your footing in what is new.',
        'If a change is making you anxious, choose one familiar routine or reliable person to stay connected with. You do not have to understand the whole transition today.',
        'Adjusting to a change can take energy even when nothing looks physically demanding. Make room for a gentler pace while the unfamiliar becomes more familiar.',
        'When change feels overwhelming, focus on the next practical step instead of the whole transition. Keep one small routine that makes the day feel more recognizable.',
        'If a change has disrupted your motivation, rebuild through one small routine. Your old pace does not have to become the immediate standard for this new chapter.',
        'If a change has left you feeling disconnected, keeping in touch with one familiar person may help. You can also give new connections time to grow without rushing yourself.'
      ],
      unsure: [
        'You do not need to find a precise reason before enjoying today’s happiness. Notice what you appreciate and let the explanation remain open.',
        'Not knowing the reason is a complete answer for now. You can check in with your needs without turning an ordinary feeling into a problem to solve.',
        'You can feel sad without knowing exactly why. Care and company do not require a perfectly explained reason.',
        'If you cannot name what is making you anxious, you can begin with what is in front of you. Choose one small thing you can do or ask for right now.',
        'Even without a clear explanation for your tiredness, you can respond to the energy you have today. You do not need to prove the cause before taking a pause.',
        'If you cannot tell where the overwhelm begins, choose the smallest immediate need. Understanding the whole picture can wait while you make this moment more manageable.',
        'Not knowing why you have little motivation does not mean you deserve blame. Try a very small action or a little rest, then notice what feels more helpful.',
        'You do not have to explain your loneliness before asking for company. A simple wish to talk is enough to begin reaching out.'
      ]
    },
    taglish: {
      school: [
        'Kung school ang kasama sa saya mo, pansinin ang learning, effort, o connection na naging meaningful today. Puwede kang mag-celebrate bago mag-set ng panibagong goal.',
        'Kung studies ang nasa isip mo, one manageable task can give today some direction. Hindi kailangang punuin ng schoolwork ang lahat ng free time mo.',
        'Kung may nangyari sa school na nakasakit o nakadismaya, bigyan iyon ng kaunting space. Isang mahirap na experience sa school ay hindi buong sukatan ng kaya mo.',
        'Kung school ang nagpapakaba, ihiwalay muna ang next actual task sa lahat ng imagined outcomes. Puwedeng humingi ng linaw sa teacher o kaklase tungkol sa bahaging hindi mo pa sure.',
        'Kapag pagod ka na, schoolwork can ask for more energy than you have. Piliin ang pinaka-kailangan, mag-pause, at tingnan kung ano ang puwedeng maghintay.',
        'Kung overwhelming ang school ngayon, ilista ang actual deadlines at pumili ng isang maliit na parte. Puwede kang humingi ng help para malaman kung ano talaga ang dapat unahin.',
        'Kung hirap kang ganahan sa studies, isang page o isang example lang muna. Puwede kang magsimula kahit hindi ka pa excited sa buong subject.',
        'Kapag lonely ka sa school, puwedeng malayo pa rin ang feeling kahit puno ang classroom. Try one small conversation o shared study session, without forcing yourself to fit in everywhere.'
      ],
      work: [
        'Kung work ang nagpasaya sa’yo, kilalanin ang naging maayos at ang contribution mo. Hindi kailangang dagdagan agad ang responsibilities para maging valid ang celebration.',
        'Kung work ang bahagi ng araw mo, makakatulong ang realistic na stopping point. May buhay at needs ka rin sa labas ng tasks.',
        'Puwedeng masakit ang disappointment sa work nang hindi nito dinedefine ang ability mo. Give yourself time bago husgahan ang buong future mula sa isang outcome.',
        'Kung work ang nagpapakaba, linawin muna ang expectations kaysa hulaan ang bawat reaction. Isang specific na tanong can help more than another round of overthinking.',
        'Kung work ang kasama sa pagod mo, pumili ng realistic na stopping point. Puwedeng sabihin ang capacity mo at itanong ang priority bago ibigay sa lahat ng task ang huli mong energy.',
        'Kung overloaded ang work, paghiwalayin ang urgent, puwedeng maghintay, at puwedeng ipatulong. Ang sobrang workload needs a clearer plan, hindi dagdag na sisi sa sarili.',
        'Kung mahirap simulan ang work, gawing concrete at maliit ang first task. Buksan ang file o magsulat ng rough sentence without promising a perfect result.',
        'Puwedeng lonely ka sa work kahit maraming tao sa paligid. Isang maikling usapan o break kasama ng approachable na colleague can be a small start without forcing closeness.'
      ],
      family: [
        'Kung family ang nagbigay ng saya, puwede mong sabihin kung anong moment ang na-appreciate mo. May halaga ang small expressions of care.',
        'Kung family ang nasa isip mo, check kung company o sariling space ang gusto mo today. Puwedeng alinman doon ang bagay sa tahimik na araw.',
        'Kapag family ang kasama sa lungkot, puwedeng malapit talaga sa puso ang sakit. You can acknowledge it at lumapit sa trusted person without fixing everything today.',
        'Kung family matters ang nagpapakaba, focus sa isang conversation o action na part mo talaga. Hindi lahat ng reaction ng iba ay responsibility mong kontrolin.',
        'Family matters can take energy, sa emotions man o sa mga gawain. Piliin kung help, company, o sariling space ang kailangan mong maipahayag ngayon, without carrying every family concern at once.',
        'Kung overwhelming ang needs ng family, sabihin kung ano ang kaya mong ibigay at saan ka kailangan ng help. Hindi nabubura ang care mo dahil may limits ka.',
        'Kung family concerns ang kumukuha ng gana mo, isang manageable responsibility lang muna. Hindi mo kailangang buhatin lahat ng expectations bago alagaan ang sarili mong araw.',
        'Puwedeng lonely ka sa family, at totoo pa rin ang feeling na iyon. Kung komportable, sabihin kung anong company o pakikinig ang gusto mong matanggap.'
      ],
      relationships: [
        'Kung friend o taong malapit sa’yo ang nagpasaya, let them know what you valued. Hindi kailangan ng special occasion para ma-appreciate ang connection.',
        'Kung friendship o relationship ang nasa isip mo, a simple check-in can be enough today. Hindi laging kailangan ng exciting na lakad o mahabang usapan.',
        'Kung ibang tao ang kasama sa lungkot mo, puwede mo siyang mahalagahan habang kinikilala ang sarili mong hurt. Give yourself time para malaman ang needs mo bago sa mahirap na conversation.',
        'Kung kinakabahan ka tungkol sa friendship o relationship, ihiwalay ang alam mo sa hula. Kung appropriate, ask for clarity kaysa mag-decide agad kung ano ang iniisip ng ibang tao.',
        'Kung nakakapagod ang isang friendship o relationship ngayon, puwede kang humingi ng pause. Hindi kailangan ng availability sa bawat usapan para masabing caring ka.',
        'Kung overwhelming ang relationship, isang concern at a time muna. Puwedeng magsabi ng need o boundary without solving the entire relationship in one sitting.',
        'Kung relationship concern ang kumukuha ng motivation mo, pumili ng isang small action na aalaga sa’yo. Puwede kang bumalik sa conversation kapag may mas maluwag ka nang space.',
        'Kung distant ang feeling mo sa isang tao, a small honest invitation can give connection a chance. Puwede kang mag-ayang mag-usap kahit hindi mo ma-explain perfectly ang loneliness.'
      ],
      self: [
        'Kung may bagay sa sarili mong nagpasaya sa’yo today, give yourself credit. Totoo ang growth at enjoyment mo kahit hindi ito nakikita ng ibang tao.',
        'Kung sarili mo ang kinukumusta, hindi kailangang ayusin agad ang ordinaryong mood. Notice one need na kaya mong tugunan nang hindi hinihinging maging ibang version ka.',
        'Kung nagiging self-criticism ang lungkot, ihiwalay ang feeling sa buong identity mo. Puwedeng may mahirap kang pinagdaraanan nang hindi ka isang disappointment.',
        'Kung ability o future mo ang pinag-aalala mo, balik muna sa isang bagay na kaya mong subukan. Uncertainty is not evidence na mabibigo ka.',
        'Kung sobra mong pine-pressure ang sarili, iayon ang expectations today sa energy na meron ka. Hindi binubura ng rest ang effort na naibigay mo na.',
        'Kung overwhelming ang sarili mong expectations, piliin kung alin talaga ang mahalaga today. Puwedeng mas maliit ang plano, instead of treating every wish as urgent.',
        'Kung sinisisi mo ang sarili dahil walang motivation, try curiosity before criticism. Mas helpful minsan ang maliit na realistic start kaysa panibagong promise na magbabago ka overnight.',
        'Kung lonely ka sa sarili mong thoughts, hindi mo kailangang maging mas lovable muna bago mag-reach out. Puwedeng humingi ng company bilang kung sino ka ngayon.'
      ],
      change: [
        'Kung may change na nagpasaya sa’yo, enjoy discovering kung ano ang maganda rito. Hindi kailangang mapped out ang buong future para ma-appreciate ang simula.',
        'Kung may change sa buhay mo, puwedeng obserbahan muna kung paano ka nagse-settle in. You can build familiarity one ordinary day at a time.',
        'Puwedeng may sadness sa change kahit may parts nito na ginusto mo. Give yourself room na ma-miss ang familiar habang hinahanap ang footing sa bago.',
        'Kung change ang nagpapakaba, pumili ng isang familiar routine o reliable person na makaka-connect mo. Hindi kailangang maintindihan ang buong transition today.',
        'Nakakagamit din ng energy ang pag-adjust kahit walang physically demanding na ginagawa. Puwedeng gentler muna ang pace habang nasasanay sa bagong sitwasyon.',
        'Kung overwhelming ang change, focus muna sa next practical step kaysa sa buong transition. Keep one small routine para may pamilyar na parte ang araw.',
        'Kung nagulo ng change ang motivation mo, bumuo ulit mula sa isang maliit na routine. Hindi kailangang lumang pace mo agad ang standard sa bagong chapter.',
        'Kung change ang dahilan ng disconnection, puwedeng kumontak sa isang familiar person. Bigyan din ng oras ang new connections na lumago without rushing yourself.'
      ],
      unsure: [
        'Hindi kailangang mahanap ang exact reason bago mo i-enjoy ang saya today. Notice what you appreciate at hayaan munang bukas ang explanation.',
        'Okay lang na hindi mo pa alam ang reason. Puwede mong kumustahin ang needs mo without turning an ordinary feeling into a problem.',
        'Puwedeng sad ka kahit hindi mo alam exactly why. Hindi kailangan ng perfect explanation para maging deserving ng care at company.',
        'Kung hindi mo ma-name ang nagpapakaba, start with what is in front of you. Pumili ng isang maliit na action o tulong na puwede mong hingin ngayon.',
        'Kahit hindi malinaw ang reason ng pagod, puwede mong tugunan ang energy na meron ka today. Hindi kailangang mapatunayan muna ang cause bago mag-pause.',
        'Kung hindi mo malaman kung saan nagsisimula ang overwhelm, unahin ang pinakamaliit na immediate need. Puwedeng maghintay ang buong explanation habang pinapagaan ang moment na ito.',
        'Hindi automatic na may dapat kang sisihin dahil hindi mo alam kung bakit walang motivation. Try a tiny action o kaunting rest, tapos pansinin kung ano ang mas helpful.',
        'Hindi mo kailangang ma-explain ang loneliness bago humingi ng company. A simple wish to talk is enough para magsimulang mag-reach out.'
      ]
    },
    tagalog: {
      school: [
        'Kung pag-aaral ang kasama sa saya mo, pansinin ang natutuhan, pagsisikap, o ugnayang naging mahalaga ngayon. Maaari kang magdiwang bago magtakda ng panibagong hangarin.',
        'Kung pag-aaral ang nasa isip mo, isang kayang gawain ay makapagbibigay ng direksiyon sa araw. Hindi kailangang punuin ng pag-aaral ang lahat ng malayang oras.',
        'Kung may nangyari sa paaralan na nakasakit o nakadismaya, bigyan iyon ng puwang. Isang mahirap na karanasan sa paaralan ay hindi buong sukatan ng kakayahan mo.',
        'Kung pag-aaral ang nagpapakaba, ihiwalay ang susunod na tunay na gawain sa mga kalalabasang iniisip mo pa lamang. Maaaring humingi ng paglilinaw sa guro o kaklase.',
        'Maaaring humingi ng maraming lakas ang pag-aaral kapag pagod ka na. Piliin ang pinaka-kailangan, huminto sandali, at tingnan kung ano ang maaari pang maghintay.',
        'Kung napakabigat ng pag-aaral ngayon, itala ang mga takdang araw at pumili ng isang munting bahagi. Maaari kang humingi ng tulong sa pagpili ng dapat unahin.',
        'Kung mahirap ganahang mag-aral, isang pahina o isang halimbawa lang muna. Maaari kang magsimula kahit hindi ka pa nasisiyahan sa buong aralin.',
        'Kapag pakiramdam mo ay nag-iisa ka sa paaralan, maaaring malayo pa rin ang loob kahit puno ang silid. Isang munting usapan o sabayang pag-aaral ay maaaring maging banayad na simula ng ugnayan.'
      ],
      work: [
        'Kung trabaho ang nagpasaya sa iyo, kilalanin ang naging maayos at ang naging ambag mo. Hindi kailangang dagdagan agad ang tungkulin para maging karapat-dapat sa pagdiriwang.',
        'Kung trabaho ang bahagi ng araw mo, makatutulong ang makatotohanang oras ng paghinto. May buhay at pangangailangan ka rin sa labas ng mga gawain.',
        'Maaaring masakit ang pagkadismaya sa trabaho nang hindi nito inilalarawan ang buong kakayahan mo. Bigyan ang sarili ng panahon bago husgahan ang kinabukasan mula sa isang kinalabasan.',
        'Kung trabaho ang nagpapakaba, linawin muna ang inaasahan sa iyo sa halip na hulaan ang bawat tugon. Maaaring mas makatulong ang isang malinaw na tanong kaysa paulit-ulit na pag-aalala.',
        'Kung trabaho ang kasama sa pagod mo, pumili ng makatotohanang oras ng paghinto. Maaari mong sabihin ang kaya mo at itanong ang dapat unahin bago ibigay ang nalalabing lakas sa bawat gawain.',
        'Kung sobrang bigat ng trabaho, paghiwalayin ang kailangang gawin agad, maaaring maghintay, at maaaring ipatulong. Ang gawaing lampas sa kaya mo ay nangangailangan ng mas malinaw na plano.',
        'Kung mahirap simulan ang trabaho, gawing malinaw at maliit ang unang gawain. Buksan ang dokumento o sumulat ng unang pangungusap nang hindi hinihinging maging mahusay agad ang bunga.',
        'Maaari kang mangulila sa trabaho kahit may mga tao sa paligid. Isang maikling usapan o pahingang may kasama ay maaaring maging munting simula nang hindi pinipilit ang pagiging malapit.'
      ],
      family: [
        'Kung pamilya ang nagpasaya sa iyo, maaari mong sabihin ang sandaling pinahalagahan mo. May saysay ang maliliit na pagpaparamdam ng malasakit.',
        'Kung pamilya ang nasa isip mo, pansinin kung kasama o sariling puwang ang gusto mo ngayon. Maaaring alinman doon ang bagay sa payak na araw.',
        'Kapag pamilya ang kasama sa lungkot, maaaring malapit sa puso ang sakit. Maaari mong kilalanin iyon at lumapit sa pinagkakatiwalaan nang hindi inaayos ang lahat agad.',
        'Kung usaping pampamilya ang nagpapakaba, ituon ang pansin sa isang kilos o usapang bahagi mo talaga. Hindi lahat ng tugon ng iba ay hawak mong baguhin.',
        'Maaaring kumuha ng lakas ang usaping pampamilya, sa damdamin man o sa mga gawain. Piliin kung tulong, kasama, o sariling puwang ang kailangan mong maipahayag ngayon nang hindi sinasalo ang lahat ng alalahanin.',
        'Kung napakabigat ng mga pangangailangan ng pamilya, sabihin ang makatotohanan mong maibibigay at kung saan mo kailangan ng tulong. Hindi nawawala ang malasakit mo dahil may hangganan ka.',
        'Kung usaping pampamilya ang kumukuha ng gana mo, isang kayang tungkulin lang muna. Hindi kailangang dalhin ang bawat inaasahan bago alagaan ang sarili mong araw.',
        'Maaari kang mangulila sa loob ng pamilya, at totoo pa rin ang damdaming iyon. Kung maginhawa para sa iyo, sabihin ang uri ng kasama o pakikinig na kailangan mo.'
      ],
      relationships: [
        'Kung kaibigan o taong malapit sa iyo ang nagpasaya, ipaalam kung ano ang pinahalagahan mo. Hindi kailangan ng natatanging okasyon para kilalanin ang ugnayan.',
        'Kung kaibigan o ugnayan ang nasa isip mo, maaaring sapat muna ang simpleng pangangamusta. Hindi laging kailangan ng kapana-panabik na lakad o mahabang usapan.',
        'Kung ibang tao ang kasama sa lungkot mo, maaari mo siyang pahalagahan habang kinikilala ang sariling sakit. Bigyan ang sarili ng panahon upang malaman ang kailangan mo bago sa mahirap na usapan.',
        'Kung kinakabahan ka tungkol sa pagkakaibigan o ugnayan, ihiwalay ang alam mo sa hula. Kung angkop, humingi ng paglilinaw sa halip na pagpasyahan agad kung ano ang iniisip ng ibang tao.',
        'Kung nakakapagod ang isang pagkakaibigan o ugnayan ngayon, maaari kang humingi ng paghinto. Hindi kailangang laging handa sa bawat usapan para masabing may malasakit ka.',
        'Kung napakabigat ng isang ugnayan, isang usapin lang muna ang harapin. Maaaring magsabi ng pangangailangan o hangganan nang hindi inaayos ang buong ugnayan sa iisang pag-uusap.',
        'Kung usapin sa isang ugnayan ang kumukuha ng gana mo, pumili ng isang munting kilos na mag-aalaga sa iyo. Maaari kang bumalik sa usapan kapag may mas maluwag ka nang panahon.',
        'Kung malayo ang pakiramdam mo sa isang tao, maaaring magbigay ng pagkakataon ang isang tapat na paanyaya. Maaari kang mag-ayang mag-usap kahit hindi mo maipaliwanag nang buo ang pangungulila.'
      ],
      self: [
        'Kung may bagay sa sarili mong nagpasaya ngayon, kilalanin iyon. Totoo ang pag-unlad at kasiyahan mo kahit walang ibang nakakakita.',
        'Kung sarili mo ang kinukumusta, hindi kailangang baguhin agad ang pangkaraniwang damdamin. Pansinin ang isang pangangailangang kayang tugunan nang hindi hinihinging maging ibang tao ka.',
        'Kung nagiging pagsisi sa sarili ang lungkot, ihiwalay ang damdamin sa buong pagkatao mo. Maaaring may mahirap kang pinagdaraanan nang hindi ka isang kabiguan.',
        'Kung kakayahan o kinabukasan mo ang pinag-aalala mo, bumalik sa isang bagay na kaya mong subukan. Ang kawalan ng katiyakan ay hindi patunay na mabibigo ka.',
        'Kung sobra ang hinihingi mo sa sarili, iayon ang inaasahan ngayon sa lakas na mayroon ka. Hindi binubura ng pahinga ang pagsisikap na naibigay mo na.',
        'Kung napakabigat ng sarili mong inaasahan, piliin kung alin talaga ang mahalaga ngayon. Maaari kang bumuo ng mas maliit na plano sa halip na ituring na kagyat ang bawat hangarin.',
        'Kung sinisisi mo ang sarili dahil walang gana, unahin ang pag-unawa. Maaaring mas makatulong ang maliit na makatotohanang simula kaysa sa pangakong magbabago ang lahat nang magdamag.',
        'Kung mag-isa ka sa mga iniisip mo, hindi mo kailangang baguhin muna ang sarili bago lumapit sa iba. Maaari kang humingi ng kasama bilang kung sino ka ngayon.'
      ],
      change: [
        'Kung may pagbabagong nagpasaya sa iyo, pahalagahan ang pagtuklas sa mabuti rito. Hindi kailangang malinaw ang buong kinabukasan para masiyahan sa simula.',
        'Kung may pagbabago sa buhay mo, maaari mong obserbahan muna kung paano ka nakikibagay. Unti-unting nabubuo ang pagiging pamilyar sa bawat pangkaraniwang araw.',
        'Maaaring may lungkot sa pagbabago kahit may bahagi nitong ginusto mo. Bigyan ang sarili ng puwang na mangulila sa pamilyar habang nasasanay sa bago.',
        'Kung pagbabago ang nagpapakaba, pumili ng isang pamilyar na gawain o mapagkakatiwalaang tao na makauugnayan. Hindi kailangang maunawaan ang buong paglipat ngayon.',
        'Gumagamit din ng lakas ang pakikibagay kahit walang mabigat na binubuhat. Maaari munang maging banayad ang takbo habang nasasanay sa bagong kalagayan.',
        'Kung napakabigat ng pagbabago, ituon muna ang pansin sa susunod na praktikal na hakbang. Panatilihin ang isang munting nakasanayan upang may pamilyar na bahagi ang araw.',
        'Kung nagulo ng pagbabago ang gana mo, magsimulang muli sa isang munting nakasanayan. Hindi kailangang dating bilis mo agad ang maging pamantayan sa bagong yugto.',
        'Kung pagbabago ang naglayo sa mga dating ugnayan, maaaring kumontak sa isang pamilyar na tao. Bigyan din ng panahon ang mga bagong ugnayan na lumago nang hindi minamadali ang sarili.'
      ],
      unsure: [
        'Hindi kailangang matukoy ang dahilan bago maranasan ang saya ngayon. Pansinin ang pinahahalagahan mo at hayaang bukas muna ang paliwanag.',
        'Ayos lang na hindi mo pa alam ang dahilan. Maaari mong kumustahin ang kailangan mo nang hindi ginagawang suliranin ang pangkaraniwang damdamin.',
        'Maaari kang malungkot kahit hindi mo alam kung bakit. Hindi kailangan ng ganap na paliwanag para tumanggap ng pag-aalaga at kasama.',
        'Kung hindi matukoy ang nagpapakaba, magsimula sa nasa harap mo. Pumili ng isang munting kilos o tulong na maaari mong hingin ngayon.',
        'Kahit hindi malinaw ang dahilan ng pagod, maaari mong tugunan ang lakas na mayroon ka ngayon. Hindi kailangang patunayan muna ang sanhi bago huminto sandali.',
        'Kung hindi mo matukoy ang simula ng bigat, unahin ang pinakamaliit na kasalukuyang pangangailangan. Maaaring maghintay ang buong paliwanag habang pinapagaan ang sandaling ito.',
        'Hindi kailangang sisihin ang sarili dahil hindi mo alam kung bakit walang gana. Subukan ang munting kilos o kaunting pahinga at pansinin kung alin ang mas makatutulong.',
        'Hindi kailangang maipaliwanag ang pangungulila bago humingi ng kasama. Sapat na simula ang simpleng pagnanais na makipag-usap.'
      ]
    }
  };

  function resolve(reason) {
    // A subjective note must not silently replace the person's own choice.
    return { reason: reason && Object.hasOwn(messages.english, reason) ? reason : null };
  }

  function build(language, mood, reason) {
    const match = resolve(reason);
    const base = window.MOTIVATIONS[language][mood];
    if (!match.reason) return { ...match, responses: base };
    const advice = messages[language][match.reason][order.indexOf(mood)];
    const closings = window.MOOD_CLOSINGS[language][mood];
    const responses = base.map((response, index) => {
      const split = response.search(/[.!?]\s/);
      const opening = split < 0 ? response : response.slice(0, split + 1);
      // Keep the topic-specific advice central. The ending stays about the mood,
      // rather than introducing another situation from the general response bank.
      return opening + ' ' + advice + ' ' + closings[index % closings.length];
    });
    return { ...match, responses };
  }

  window.PERSONALIZATION = { resolve, build };
})();
