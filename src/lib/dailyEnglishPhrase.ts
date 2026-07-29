import { kstNow } from "./kst";

export interface DailyEnglishPhrase {
  id: string;
  en: string;
  ko: string;
  fieldKo: string;
  fieldEn: string;
}

// Hyperdoctor Rapport(english.hyperdoctor.app)의 "오늘의 표현"과 같은 날 같은 문장이
// 뜨도록, 그쪽 src/lib/data/daily.ts의 DAILY_ADVANCED_ITEMS를 그대로 옮겨왔다.
// ⚠️ Rapport 쪽에서 이 배열을 늘리거나 바꾸면 여기도 함께 갱신해야 서로 어긋나지 않는다.
const DAILY_ADVANCED_ITEMS: DailyEnglishPhrase[] = [
  { id: "da-1", en: "The patient's presentation is most consistent with granulomatosis with polyangiitis, given the renal involvement and upper airway symptoms.", ko: "환자의 임상양상은 신장 침범과 상기도 증상을 고려할 때 다발혈관염 육아종증에 가장 부합합니다.", fieldKo: "류마티스내과", fieldEn: "Rheumatology" },
  { id: "da-2", en: "We need to rule out hemophagocytic lymphohistiocytosis given the persistent fever, cytopenias, and elevated ferritin.", ko: "지속되는 발열, 혈구감소증, 페리틴 상승을 고려하면 혈구탐식성 림프조직구증을 배제해야 합니다.", fieldKo: "혈액종양내과", fieldEn: "Hematology-Oncology" },
  { id: "da-3", en: "The biopsy confirmed dermatomyositis, with a classic heliotrope rash and Gottron's papules.", ko: "조직검사에서 전형적인 헬리오트로프 발진과 고트론 구진을 동반한 피부근염이 확인되었습니다.", fieldKo: "피부과·류마티스내과", fieldEn: "Dermatology / Rheumatology" },
  { id: "da-4", en: "His echocardiogram revealed findings consistent with a pheochromocytoma-induced cardiomyopathy.", ko: "심장초음파에서 크롬친화세포종으로 인한 심근병증 소견이 확인됐습니다.", fieldKo: "내분비내과", fieldEn: "Endocrinology" },
  { id: "da-5", en: "The patient has a history of thrombotic thrombocytopenic purpura, so we should monitor her platelet count closely.", ko: "환자는 혈전성 혈소판감소성 자반증 병력이 있어 혈소판 수치를 면밀히 관찰해야 합니다.", fieldKo: "혈액내과", fieldEn: "Hematology" },
  { id: "da-6", en: "This presentation is suspicious for coccidioidomycosis given his recent travel to the southwestern United States.", ko: "최근 미국 남서부 여행력을 고려하면 콕시디오이도마이코시스가 의심됩니다.", fieldKo: "감염내과", fieldEn: "Infectious Disease" },
  { id: "da-7", en: "The CT findings are suggestive of necrotizing fasciitis, so we need a surgical consultation immediately.", ko: "CT 소견상 괴사성 근막염이 의심되어 즉시 외과 협진이 필요합니다.", fieldKo: "외과·감염내과", fieldEn: "Surgery / Infectious Disease" },
  { id: "da-8", en: "Given the joint stiffness and sacroiliac involvement, this is most likely ankylosing spondylitis.", ko: "관절 강직과 천장관절 침범을 고려할 때 강직성 척추염일 가능성이 높습니다.", fieldKo: "류마티스내과", fieldEn: "Rheumatology" },
  { id: "da-9", en: "The renal biopsy is consistent with rapidly progressive glomerulonephritis.", ko: "신장 조직검사 소견은 급속진행성 사구체신염에 부합합니다.", fieldKo: "신장내과", fieldEn: "Nephrology" },
  { id: "da-10", en: "We suspect paroxysmal nocturnal hemoglobinuria based on the hemolysis and dark urine in the morning.", ko: "용혈과 아침의 짙은 소변색을 고려하면 발작성 야간 혈색소뇨증이 의심됩니다.", fieldKo: "혈액내과", fieldEn: "Hematology" },
  { id: "da-11", en: "The imaging shows choledocholithiasis with dilation of the common bile duct.", ko: "영상 검사에서 총담관 확장을 동반한 총담관결석이 확인됩니다.", fieldKo: "소화기내과", fieldEn: "Gastroenterology" },
  { id: "da-12", en: "This looks like a classic case of xeroderma pigmentosum, given the extreme photosensitivity since infancy.", ko: "영아기부터의 극심한 광과민성을 고려하면 전형적인 착색건피증 사례로 보입니다.", fieldKo: "피부과", fieldEn: "Dermatology" },
  { id: "da-13", en: "His symptoms are consistent with amyotrophic lateral sclerosis, so we'll refer him to neurology for further workup.", ko: "증상이 근위축성 측삭경화증에 부합하여 추가 검사를 위해 신경과로 의뢰하겠습니다.", fieldKo: "신경과", fieldEn: "Neurology" },
  { id: "da-14", en: "We're considering Guillain-Barré syndrome given the ascending weakness following his recent viral illness.", ko: "최근 바이러스 질환 이후 상행성 위약을 고려하면 길랭-바레 증후군을 의심하고 있습니다.", fieldKo: "신경과", fieldEn: "Neurology" },
  { id: "da-15", en: "The patient's rare condition, pseudopseudohypoparathyroidism, doesn't require the same calcium management as true hypoparathyroidism.", ko: "환자의 희귀질환인 가성가성부갑상선기능저하증은 실제 부갑상선기능저하증과 같은 칼슘 관리가 필요하지 않습니다.", fieldKo: "내분비내과", fieldEn: "Endocrinology" },
  { id: "da-16", en: "The patient's chronic productive cough and travel history raise concern for a granulomatous infection.", ko: "만성 가래 기침과 여행력을 고려하면 육아종성 감염이 우려됩니다.", fieldKo: "호흡기내과", fieldEn: "Pulmonology" },
  { id: "da-17", en: "We're treating this as anaphylaxis given the rapid onset of urticaria, hypotension, and airway swelling.", ko: "두드러기, 저혈압, 기도부종이 급격히 발생한 것을 고려해 아나필락시스로 치료하고 있습니다.", fieldKo: "응급의학과·알레르기내과", fieldEn: "Emergency Medicine / Allergy" },
  { id: "da-18", en: "The elevated troponin and new wall motion abnormality are concerning for an evolving myocardial infarction.", ko: "트로포닌 상승과 새로 발생한 벽운동이상은 진행 중인 심근경색을 시사합니다.", fieldKo: "순환기내과", fieldEn: "Cardiology" },
  { id: "da-19", en: "Her presentation with proximal muscle weakness and elevated creatine kinase is consistent with polymyositis.", ko: "근위부 근력저하와 크레아틴키나제 상승 소견은 다발근염에 부합합니다.", fieldKo: "류마티스내과", fieldEn: "Rheumatology" },
  { id: "da-20", en: "We suspect a paraneoplastic syndrome given his rapid weight loss and new-onset peripheral neuropathy.", ko: "급격한 체중 감소와 새로 발생한 말초신경병증을 고려하면 부종양증후군이 의심됩니다.", fieldKo: "종양내과", fieldEn: "Oncology" },
  { id: "da-21", en: "The lumbar puncture revealed oligoclonal bands, supporting a diagnosis of multiple sclerosis.", ko: "요추천자에서 올리고클로날 밴드가 확인되어 다발성 경화증 진단을 뒷받침합니다.", fieldKo: "신경과", fieldEn: "Neurology" },
  { id: "da-22", en: "Her recurrent miscarriages and prolonged PTT raise suspicion for antiphospholipid syndrome.", ko: "반복되는 유산과 연장된 PTT는 항인지질항체증후군을 의심하게 합니다.", fieldKo: "류마티스내과·산부인과", fieldEn: "Rheumatology / OB-GYN" },
  { id: "da-23", en: "The skin biopsy is consistent with pyoderma gangrenosum, which is often associated with inflammatory bowel disease.", ko: "피부 조직검사는 염증성 장질환과 흔히 동반되는 괴저성 농피증에 부합합니다.", fieldKo: "피부과·소화기내과", fieldEn: "Dermatology / Gastroenterology" },
  { id: "da-24", en: "We're monitoring for tumor lysis syndrome given his rapid response to chemotherapy.", ko: "항암치료에 대한 급격한 반응을 고려해 종양용해증후군 발생 여부를 관찰하고 있습니다.", fieldKo: "종양내과", fieldEn: "Oncology" },
  { id: "da-25", en: "The patient's Kayser-Fleischer rings and low ceruloplasmin strongly suggest Wilson's disease.", ko: "카이저-플라이셔 고리와 낮은 세룰로플라스민 수치는 윌슨병을 강하게 시사합니다.", fieldKo: "소화기내과·신경과", fieldEn: "Gastroenterology / Neurology" },
  { id: "da-26", en: "The malar rash and photosensitivity, combined with a positive ANA, point toward systemic lupus erythematosus.", ko: "나비모양 발진과 광과민성, 양성 ANA를 종합하면 전신홍반루푸스를 시사합니다.", fieldKo: "류마티스내과", fieldEn: "Rheumatology" },
  { id: "da-27", en: "The peripheral smear showing schistocytes raises concern for a microangiopathic hemolytic anemia.", ko: "말초혈액도말에서 파편적혈구가 보여 미세혈관병성 용혈성 빈혈이 우려됩니다.", fieldKo: "혈액내과", fieldEn: "Hematology" },
  { id: "da-28", en: "The ptosis and fatigability that worsen throughout the day are classic for myasthenia gravis.", ko: "하루 동안 점점 심해지는 안검하수와 피로도는 중증근무력증의 전형적인 소견입니다.", fieldKo: "신경과", fieldEn: "Neurology" },
  { id: "da-29", en: "Given his HIV status and the ring-enhancing lesion on MRI, we're considering toxoplasmosis encephalitis.", ko: "HIV 감염 상태와 MRI상 고리모양 조영증강 병변을 고려해 톡소플라스마 뇌염을 의심하고 있습니다.", fieldKo: "감염내과", fieldEn: "Infectious Disease" },
  { id: "da-30", en: "The moon facies, buffalo hump, and purple striae are classic features of Cushing's syndrome.", ko: "달덩이 얼굴, 물소혹, 자주색 선조는 쿠싱증후군의 전형적인 특징입니다.", fieldKo: "내분비내과", fieldEn: "Endocrinology" },
  { id: "da-31", en: "The nephrotic-range proteinuria and oval fat bodies in the urine are consistent with minimal change disease.", ko: "신증후군 범위의 단백뇨와 소변 내 지방원주는 미세변화신증에 부합합니다.", fieldKo: "신장내과", fieldEn: "Nephrology" },
  { id: "da-32", en: "The skip lesions on colonoscopy, despite the bloody diarrhea, are more consistent with Crohn's disease than ulcerative colitis.", ko: "혈성 설사가 있음에도 대장내시경상 비연속 병변이 보여 궤양성대장염보다 크론병에 더 부합합니다.", fieldKo: "소화기내과", fieldEn: "Gastroenterology" },
  { id: "da-33", en: "The wide, fixed splitting of S2 is suggestive of an atrial septal defect.", ko: "고정성으로 넓게 갈라지는 제2심음은 심방중격결손을 시사합니다.", fieldKo: "순환기내과", fieldEn: "Cardiology" },
  { id: "da-34", en: "The honeycombing pattern on his chest CT is characteristic of idiopathic pulmonary fibrosis.", ko: "흉부 CT상 벌집모양 패턴은 특발성폐섬유증의 특징적인 소견입니다.", fieldKo: "호흡기내과", fieldEn: "Pulmonology" },
  { id: "da-35", en: "The target lesions with three distinct zones are classic for erythema multiforme.", ko: "세 개의 구분되는 층을 가진 표적모양 병변은 다형홍반의 전형적인 소견입니다.", fieldKo: "피부과", fieldEn: "Dermatology" },
  { id: "da-36", en: "The triad of altered mental status, hyperthermia, and autonomic instability raises concern for serotonin syndrome.", ko: "의식변화, 고체온, 자율신경 불안정의 3대 증상은 세로토닌증후군을 의심하게 합니다.", fieldKo: "응급의학과", fieldEn: "Emergency Medicine" },
  { id: "da-37", en: "His grandiosity, decreased need for sleep, and impulsivity over the past week are consistent with a manic episode.", ko: "지난 일주일간의 과대망상, 수면욕구 감소, 충동성은 조증 삽화에 부합합니다.", fieldKo: "정신건강의학과", fieldEn: "Psychiatry" },
  { id: "da-38", en: "The sudden, painless monocular vision loss raises concern for a central retinal artery occlusion.", ko: "갑작스럽고 통증 없는 한쪽 눈의 시력 소실은 망막중심동맥폐쇄를 의심하게 합니다.", fieldKo: "안과", fieldEn: "Ophthalmology" },
  { id: "da-39", en: "The six P's — pain, pallor, pulselessness, paresthesia, paralysis, and poikilothermia — raise concern for compartment syndrome.", ko: "6P 징후인 통증, 창백, 무맥, 감각이상, 마비, 냉감은 구획증후군을 의심하게 합니다.", fieldKo: "정형외과", fieldEn: "Orthopedics" },
  { id: "da-40", en: "The sudden onset of severe abdominal pain and vaginal bleeding in early pregnancy raises concern for an ectopic pregnancy.", ko: "임신 초기 갑작스러운 심한 복통과 질출혈은 자궁외임신을 의심하게 합니다.", fieldKo: "산부인과", fieldEn: "OB-GYN" },
  { id: "da-41", en: "The strawberry tongue, conjunctival injection, and peeling skin on his fingertips raise concern for Kawasaki disease.", ko: "딸기혀, 결막충혈, 손끝 피부 벗겨짐은 가와사키병을 의심하게 합니다.", fieldKo: "소아과", fieldEn: "Pediatrics" },
  { id: "da-42", en: "The flank pain radiating to the groin, along with hematuria, is highly suggestive of nephrolithiasis.", ko: "사타구니로 뻗치는 옆구리 통증과 혈뇨는 신장결석을 강하게 시사합니다.", fieldKo: "비뇨의학과", fieldEn: "Urology" },
  { id: "da-43", en: "The recurrent sinopulmonary infections and low immunoglobulin levels raise concern for common variable immunodeficiency.", ko: "반복되는 부비동·폐 감염과 낮은 면역글로불린 수치는 공통가변면역결핍증을 의심하게 합니다.", fieldKo: "알레르기내과", fieldEn: "Allergy / Immunology" },
  { id: "da-44", en: "The lens dislocation, tall stature, and aortic root dilation raise concern for Marfan syndrome.", ko: "수정체 탈구, 큰 키, 대동맥근 확장은 마르판증후군을 의심하게 합니다.", fieldKo: "유전학", fieldEn: "Genetics" },
  { id: "da-45", en: "His recurrent oral ulcers and uveitis are suggestive of Behçet's disease.", ko: "반복되는 구강궤양과 포도막염은 베체트병을 시사합니다.", fieldKo: "류마티스내과", fieldEn: "Rheumatology" },
  { id: "da-46", en: "We're evaluating for multiple myeloma given the lytic bone lesions and monoclonal protein spike.", ko: "골용해성 병변과 단클론성 단백 스파이크를 고려해 다발골수종을 평가하고 있습니다.", fieldKo: "혈액종양내과", fieldEn: "Hematology-Oncology" },
  { id: "da-47", en: "We suspect normal pressure hydrocephalus given the triad of gait disturbance, incontinence, and dementia.", ko: "보행장애, 실금, 치매의 3대 증상을 고려해 정상압수두증을 의심하고 있습니다.", fieldKo: "신경과", fieldEn: "Neurology" },
  { id: "da-48", en: "The recurrent fevers and splenomegaly after his trip to South Asia raise concern for visceral leishmaniasis.", ko: "남아시아 여행 후 반복되는 발열과 비장비대는 내장리슈만편모충증을 의심하게 합니다.", fieldKo: "감염내과", fieldEn: "Infectious Disease" },
  { id: "da-49", en: "We suspect subacute thyroiditis given the painful, tender thyroid following a recent viral illness.", ko: "최근 바이러스 질환 이후 통증을 동반한 압통성 갑상선을 고려해 아급성 갑상선염을 의심하고 있습니다.", fieldKo: "내분비내과", fieldEn: "Endocrinology" },
  { id: "da-50", en: "We're concerned about contrast-induced nephropathy given his baseline chronic kidney disease.", ko: "기저 만성신장질환을 고려하면 조영제유발신병증이 우려됩니다.", fieldKo: "신장내과", fieldEn: "Nephrology" },
  { id: "da-51", en: "We suspect primary sclerosing cholangitis given the beaded appearance of the bile ducts on MRCP.", ko: "MRCP상 담관의 염주모양 소견을 고려해 원발경화쓸개관염을 의심하고 있습니다.", fieldKo: "소화기내과", fieldEn: "Gastroenterology" },
  { id: "da-52", en: "We're concerned about cardiac tamponade given the pulsus paradoxus and muffled heart sounds.", ko: "기이맥과 심음 감소를 고려하면 심장눌림증이 우려됩니다.", fieldKo: "순환기내과", fieldEn: "Cardiology" },
  { id: "da-53", en: "We suspect a pulmonary embolism given the sudden pleuritic chest pain and elevated D-dimer.", ko: "갑작스러운 흉막성 흉통과 D-dimer 상승을 고려해 폐색전증을 의심하고 있습니다.", fieldKo: "호흡기내과", fieldEn: "Pulmonology" },
  { id: "da-54", en: "We're concerned this could progress to Stevens-Johnson syndrome given the mucosal involvement and skin sloughing.", ko: "점막 침범과 피부 박리를 고려하면 스티븐스-존슨증후군으로 진행할 가능성이 우려됩니다.", fieldKo: "피부과", fieldEn: "Dermatology" },
  { id: "da-55", en: "We're treating this as neuroleptic malignant syndrome given his recent antipsychotic use and rigidity.", ko: "최근 항정신병약물 사용과 강직을 고려해 신경이완제악성증후군으로 치료하고 있습니다.", fieldKo: "응급의학과·정신건강의학과", fieldEn: "Emergency Medicine / Psychiatry" },
  { id: "da-56", en: "We're evaluating for catatonia given his mutism, posturing, and waxy flexibility.", ko: "함구증, 자세유지, 납굴증을 고려해 긴장증을 평가하고 있습니다.", fieldKo: "정신건강의학과", fieldEn: "Psychiatry" },
  { id: "da-57", en: "We suspect acute angle-closure glaucoma given the severe eye pain, halos around lights, and a fixed, mid-dilated pupil.", ko: "심한 안통, 빛 주변의 무리, 고정된 중간산동을 고려해 급성폐쇄각녹내장을 의심하고 있습니다.", fieldKo: "안과", fieldEn: "Ophthalmology" },
  { id: "da-58", en: "His hip pain and limited internal rotation, given his age, raise concern for a slipped capital femoral epiphysis.", ko: "그의 연령대에서 고관절 통증과 제한된 내회전은 대퇴골두골단분리증을 의심하게 합니다.", fieldKo: "정형외과", fieldEn: "Orthopedics" },
  { id: "da-59", en: "We're evaluating for preeclampsia given her new-onset hypertension and proteinuria after twenty weeks.", ko: "임신 20주 이후 새로 발생한 고혈압과 단백뇨를 고려해 자간전증을 평가하고 있습니다.", fieldKo: "산부인과", fieldEn: "OB-GYN" },
  { id: "da-60", en: "The projectile, non-bilious vomiting in a six-week-old, along with a palpable 'olive' mass, raises concern for pyloric stenosis.", ko: "생후 6주 아기의 분출성 비담즙성 구토와 촉지되는 '올리브' 모양 종괴는 유문협착증을 의심하게 합니다.", fieldKo: "소아과", fieldEn: "Pediatrics" },
  { id: "da-61", en: "We suspect testicular torsion given the sudden, severe scrotal pain and absent cremasteric reflex — this requires immediate surgical evaluation.", ko: "갑작스러운 심한 음낭 통증과 소실된 고환올림근반사를 고려하면 고환염전이 의심되어 즉시 외과적 평가가 필요합니다.", fieldKo: "비뇨의학과", fieldEn: "Urology" },
  { id: "da-62", en: "We suspect hereditary angioedema given the recurrent, non-pruritic swelling episodes without urticaria.", ko: "두드러기 없이 반복되는 비소양성 부종 삽화를 고려해 유전혈관부종을 의심하고 있습니다.", fieldKo: "알레르기내과", fieldEn: "Allergy / Immunology" },
  { id: "da-63", en: "We're evaluating for Ehlers-Danlos syndrome given her joint hypermobility and skin hyperextensibility.", ko: "관절 과운동성과 피부 과신전성을 고려해 엘러스-단로스증후군을 평가하고 있습니다.", fieldKo: "유전학", fieldEn: "Genetics" },
  { id: "da-64", en: "The tender, erythematous nodules on her shins are consistent with erythema nodosum.", ko: "정강이의 압통성 홍반성 결절은 결절홍반에 부합합니다.", fieldKo: "류마티스내과", fieldEn: "Rheumatology" },
  { id: "da-65", en: "His splenomegaly and elevated white count are concerning for chronic myeloid leukemia.", ko: "비장비대와 백혈구 수 상승은 만성골수성백혈병을 시사합니다.", fieldKo: "혈액종양내과", fieldEn: "Hematology-Oncology" },
  { id: "da-66", en: "His resting tremor and cogwheel rigidity are consistent with Parkinson's disease.", ko: "안정 시 떨림과 톱니바퀴 강직은 파킨슨병에 부합합니다.", fieldKo: "신경과", fieldEn: "Neurology" },
  { id: "da-67", en: "We're treating empirically for leptospirosis given his exposure to floodwater and the conjunctival suffusion.", ko: "홍수 물 노출과 결막충혈을 고려해 렙토스피라증에 대해 경험적으로 치료하고 있습니다.", fieldKo: "감염내과", fieldEn: "Infectious Disease" },
  { id: "da-68", en: "His hyperpigmentation and orthostatic hypotension point toward primary adrenal insufficiency.", ko: "색소침착과 기립성 저혈압은 원발성 부신기능부전을 시사합니다.", fieldKo: "내분비내과", fieldEn: "Endocrinology" },
  { id: "da-69", en: "The eosinophiluria and recent antibiotic use raise suspicion for acute interstitial nephritis.", ko: "호산구뇨와 최근 항생제 사용은 급성간질성신염을 의심하게 합니다.", fieldKo: "신장내과", fieldEn: "Nephrology" },
  { id: "da-70", en: "His asterixis and elevated ammonia level suggest hepatic encephalopathy.", ko: "자세고정불능증과 암모니아 수치 상승은 간성뇌증을 시사합니다.", fieldKo: "소화기내과", fieldEn: "Gastroenterology" },
  { id: "da-71", en: "His exertional syncope and harsh systolic murmur point toward severe aortic stenosis.", ko: "운동성 실신과 거친 수축기 잡음은 중증 대동맥판막협착증을 시사합니다.", fieldKo: "순환기내과", fieldEn: "Cardiology" },
  { id: "da-72", en: "His barrel chest and prolonged expiratory phase are consistent with severe emphysema.", ko: "술통형 흉곽과 연장된 호기 시간은 중증 폐기종에 부합합니다.", fieldKo: "호흡기내과", fieldEn: "Pulmonology" },
  { id: "da-73", en: "The honey-colored crusting around his mouth is characteristic of impetigo.", ko: "입 주변의 꿀색 딱지는 농가진의 특징적인 소견입니다.", fieldKo: "피부과", fieldEn: "Dermatology" },
  { id: "da-74", en: "The cherry-red skin discoloration is a classic finding in carbon monoxide poisoning.", ko: "체리 빛깔의 피부 변색은 일산화탄소 중독의 전형적인 소견입니다.", fieldKo: "응급의학과", fieldEn: "Emergency Medicine" },
  { id: "da-75", en: "The recurrent intrusive thoughts and compulsive checking behaviors suggest obsessive-compulsive disorder.", ko: "반복되는 침습적 사고와 강박적 확인 행동은 강박장애를 시사합니다.", fieldKo: "정신건강의학과", fieldEn: "Psychiatry" },
  { id: "da-76", en: "The cotton wool spots and flame hemorrhages on fundoscopy are consistent with hypertensive retinopathy.", ko: "안저검사상 면화반과 화염모양 출혈은 고혈압망막병증에 부합합니다.", fieldKo: "안과", fieldEn: "Ophthalmology" },
  { id: "da-77", en: "We suspect avascular necrosis of the femoral head given his chronic steroid use and groin pain.", ko: "만성 스테로이드 사용력과 사타구니 통증을 고려해 대퇴골두무혈성괴사를 의심하고 있습니다.", fieldKo: "정형외과", fieldEn: "Orthopedics" },
  { id: "da-78", en: "The grape-like clusters seen on ultrasound are characteristic of a hydatidiform mole.", ko: "초음파상 포도송이 모양 소견은 포상기태의 특징적인 소견입니다.", fieldKo: "산부인과", fieldEn: "OB-GYN" },
  { id: "da-79", en: "His barking cough and inspiratory stridor are classic for croup.", ko: "개 짖는 듯한 기침과 흡기성 천명은 크룹의 전형적인 소견입니다.", fieldKo: "소아과", fieldEn: "Pediatrics" },
  { id: "da-80", en: "His eosinophilia and history of asthma raise concern for eosinophilic granulomatosis with polyangiitis.", ko: "호산구증가증과 천식 병력은 호산구성 다발혈관염육아종증을 의심하게 합니다.", fieldKo: "알레르기내과", fieldEn: "Allergy / Immunology" },
  { id: "da-81", en: "The cherry-red spot on the macula in an infant with developmental regression suggests Tay-Sachs disease.", ko: "발달 퇴행을 보이는 영아의 황반부 체리색 반점은 테이-삭스병을 시사합니다.", fieldKo: "유전학", fieldEn: "Genetics" },
  { id: "da-82", en: "Given the calcinosis, Raynaud's phenomenon, and sclerodactyly, we're considering limited systemic sclerosis.", ko: "석회증, 레이노 현상, 손가락경화증을 고려하면 제한피부전신경화증을 의심하고 있습니다.", fieldKo: "류마티스내과", fieldEn: "Rheumatology" },
  { id: "da-83", en: "The bone marrow biopsy confirmed myelodysplastic syndrome with excess blasts.", ko: "골수 조직검사에서 아세포 과다를 동반한 골수형성이상증후군이 확인되었습니다.", fieldKo: "혈액종양내과", fieldEn: "Hematology-Oncology" },
  { id: "da-84", en: "The sudden 'thunderclap' headache raises immediate concern for a subarachnoid hemorrhage.", ko: "갑작스러운 '벼락두통'은 지주막하출혈을 즉각 의심하게 합니다.", fieldKo: "신경과", fieldEn: "Neurology" },
  { id: "da-85", en: "His night sweats, weight loss, and cavitary lesion on chest X-ray are highly suggestive of pulmonary tuberculosis.", ko: "야간발한, 체중감소, 흉부 X-ray상 공동 병변은 폐결핵을 강하게 시사합니다.", fieldKo: "감염내과", fieldEn: "Infectious Disease" },
  { id: "da-86", en: "The combination of hypercalcemia, kidney stones, and osteoporosis suggests primary hyperparathyroidism.", ko: "고칼슘혈증, 신장결석, 골다공증의 조합은 원발성 부갑상선기능항진증을 시사합니다.", fieldKo: "내분비내과", fieldEn: "Endocrinology" },
  { id: "da-87", en: "The classic 'currant jelly' stool in an infant raises concern for intussusception.", ko: "영아에서 나타나는 전형적인 '적포도잼' 같은 대변은 장중첩증을 의심하게 합니다.", fieldKo: "소화기내과", fieldEn: "Gastroenterology" },
  { id: "da-88", en: "The diffuse ST elevations with PR depression are classic for acute pericarditis.", ko: "광범위한 ST분절 상승과 PR분절 하강은 급성심낭염의 전형적인 소견입니다.", fieldKo: "순환기내과", fieldEn: "Cardiology" },
  { id: "da-89", en: "Given the pinpoint pupils and respiratory depression, we suspect an opioid overdose.", ko: "축동과 호흡억제를 고려해 아편계 약물 과다복용을 의심하고 있습니다.", fieldKo: "응급의학과", fieldEn: "Emergency Medicine" },
  { id: "da-90", en: "His musty body odor and intellectual disability, if untreated from birth, raise concern for phenylketonuria.", ko: "출생 시부터 치료받지 못했다면, 곰팡이 냄새 같은 체취와 지적장애는 페닐케톤뇨증을 의심하게 합니다.", fieldKo: "유전학", fieldEn: "Genetics" },
];

// Rapport 쪽 kstDayIndex와 동일한 기준일(2024-01-01, KST)로 "며칠째"를 구한다.
// 차이점: 여기서는 today가 이미 kstNow()로 +9시간 보정된 값이라는 전제가 있으므로
// (이 프로젝트의 getTodayQuote 등과 동일한 관례), 추가로 시간을 보정하지 않고
// today의 getUTC*() 값을 그대로 KST 달력 날짜로 읽는다.
const EPOCH_KST_MIDNIGHT_UTC = Date.UTC(2024, 0, 1);

function kstDayIndex(today: Date): number {
  const kstMidnightUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.floor((kstMidnightUtc - EPOCH_KST_MIDNIGHT_UTC) / 86_400_000);
}

// 같은 날짜면 Rapport의 getDailyPick()과 항상 같은 문장을 돌려준다(풀 순서·내용이 같다는 전제 하에).
export function getDailyEnglishPhrase(today: Date = kstNow()): DailyEnglishPhrase {
  const len = DAILY_ADVANCED_ITEMS.length;
  const idx = ((kstDayIndex(today) % len) + len) % len;
  return DAILY_ADVANCED_ITEMS[idx];
}
