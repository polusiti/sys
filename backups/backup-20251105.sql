PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    last_login TEXT,
    login_count INTEGER DEFAULT 0
, display_name TEXT, inquiry_number TEXT, passkey_credential_id TEXT, passkey_public_key TEXT, passkey_sign_count INTEGER DEFAULT 0, email_verified BOOLEAN DEFAULT 0, verification_code TEXT, verification_expires TEXT, avatar_type TEXT DEFAULT 'color', avatar_value TEXT DEFAULT '#3498db', bio TEXT, goal TEXT, study_streak INTEGER DEFAULT 0, total_study_time INTEGER DEFAULT 0, secret_question TEXT DEFAULT 'あなたの好きなアニメキャラは？', secret_answer_hash TEXT);
INSERT INTO "users" VALUES(1,'test@example.com','testuser','ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f','2025-09-07 19:26:49',NULL,0,'testuser','000000',NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(2,'prodtest@example.com','produser','7e6e0c3079a08c5cc6036789b57e951f65f82383913ba1a49ae992544f1b4b6e','2025-09-07 19:28:47','2025-09-07 19:28:56',1,'produser','000001',NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(3,'test1760676670@example.com','traditionaltest1760676670','testpass123','2025-10-17 04:51:09',NULL,0,'Traditional Test',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(4,'test1760676885@example.com','test-db-check-1760676885','testpass123','2025-10-17 04:54:44',NULL,0,'DB Check',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(5,'test1760678129@example.com','test-trad-1760678129','testpass123','2025-10-17 05:15:28',NULL,0,'traditionaltest1760678129',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(6,'test1760678211@example.com','test-trad-1760678211','testpass123','2025-10-17 05:16:50',NULL,0,'test-trad-1760678211',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(7,'test-ln-1760678246@ln.local','test-ln-1760678246','ln-passkey-auth','2025-10-17 05:17:25',NULL,0,'LN Test User','123456',NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(8,'test1760678246@example.com','test-trad-1760678246','testpass123','2025-10-17 05:17:25',NULL,0,'test-trad-1760678246',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(9,'real-test-9999@ln.local','real-test-9999','ln-passkey-auth','2025-10-17 05:22:11',NULL,0,'Real Test User','999999',NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(10,'api-test-2025-10-17@ln.local','api-test-2025-10-17','ln-passkey-auth','2025-10-17 05:25:19',NULL,0,'API Connection Test','654321',NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(11,'progress@test.com','progress-test','testpass123','2025-10-17 05:26:03',NULL,0,'Progress Test',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(12,'test1760678826@example.com','test-trad-1760678826','testpass123','2025-10-17 05:27:06',NULL,0,'test-trad-1760678826',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(13,'verification-user@ln.local','verification-user','ln-passkey-auth','2025-10-17 05:27:49',NULL,0,'Verification User','222222',NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(14,'endpoint-test@ln.local','endpoint-test','ln-passkey-auth','2025-10-17 05:31:44',NULL,0,'Endpoint Test','333333',NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(15,'auth-flow-test@ln.local','auth-flow-test','ln-passkey-auth','2025-10-17 05:32:00',NULL,0,'Auth Flow Test','444444',NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(16,'github-test@ln.local','github-test','ln-passkey-auth','2025-10-17 05:36:56',NULL,0,'GitHub Test','555555',NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(17,'mana@ln.local','mana','ln-passkey-auth','2025-10-17 05:44:12',NULL,0,'jin','231231',NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(18,'test1760680348@example.com','test-trad-1760680348','testpass123','2025-10-17 05:52:27',NULL,0,'test-trad-1760680348',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(19,'test-auto-1760680400@ln.local','test-auto-1760680400','ln-passkey-auth','2025-10-17 05:52:51',NULL,0,'AutoGen Test','LNRIAVZ8',NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(20,'test-new-user-999@ln.local','test-new-user-999','ln-passkey-auth','2025-10-17 05:53:04',NULL,0,'New Test User','LNDVQYX3',NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(21,'mana1@ln.local','mana1','ln-passkey-auth','2025-10-17 05:56:46',NULL,0,'jin1','LNDZDNC0',NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(22,'mana2@ln.local','mana2','ln-passkey-auth','2025-10-21 15:33:29',NULL,0,'jim1',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','848536abe1fc6605ddedba90334103a7c7ce8669ad183a48cb4899f57ae9c558');
INSERT INTO "users" VALUES(23,'testuser1761062579@ln.local','testuser1761062579','ln-passkey-auth','2025-10-21 16:03:00',NULL,0,'Test User',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','testanswer123');
INSERT INTO "users" VALUES(24,'testuser1761063141@ln.local','testuser1761063141','ln-passkey-auth','2025-10-21 16:12:21',NULL,0,'TestUser1761063141',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','testanswer123');
INSERT INTO "users" VALUES(25,'mana3@ln.local','mana3','ln-passkey-auth','2025-10-21 16:25:02',NULL,0,'jim2',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','848536abe1fc6605ddedba90334103a7c7ce8669ad183a48cb4899f57ae9c558');
INSERT INTO "users" VALUES(26,'testuser1761064300@ln.local','testuser1761064300','ln-passkey-auth','2025-10-21 16:31:33',NULL,0,'TestUser1761064300',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','testanswer123');
INSERT INTO "users" VALUES(27,'testuser1761065563@ln.local','testuser1761065563','ln-passkey-auth','2025-10-21 16:52:44',NULL,0,'TestUser1761065563',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','testanswer123');
INSERT INTO "users" VALUES(28,'mana143@ln.local','mana143','ln-passkey-auth','2025-10-21 16:58:15',NULL,0,'jim54',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','848536abe1fc6605ddedba90334103a7c7ce8669ad183a48cb4899f57ae9c558');
INSERT INTO "users" VALUES(29,'mana1431@ln.local','mana1431','ln-passkey-auth','2025-10-21 16:58:39',NULL,0,'jim541',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','848536abe1fc6605ddedba90334103a7c7ce8669ad183a48cb4899f57ae9c558');
INSERT INTO "users" VALUES(30,'unique_test_user_1761067100@ln.local','unique_test_user_1761067100','ln-passkey-auth','2025-10-21 17:18:20',NULL,0,'Unique Test User',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','test_hash_1761067100');
INSERT INTO "users" VALUES(31,'unique_test_1761067878@ln.local','unique_test_1761067878','ln-passkey-auth','2025-10-21 17:31:18',NULL,0,'Unique Test 1761067878',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','hash_1761067878');
INSERT INTO "users" VALUES(32,'victory_user_1761068632@ln.local','victory_user_1761068632','ln-passkey-auth','2025-10-21 17:43:52',NULL,0,'Victory Test',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','victory_hash');
INSERT INTO "users" VALUES(33,'test1762326518@secure.learning-notebook.local','test1762326518','passkey-user','2025-11-05 07:08:38',NULL,0,'Test User 1762326518',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','326518');
INSERT INTO "users" VALUES(34,'test-replaced1762326668@secure.local','test-replaced1762326668','passkey-user','2025-11-05 07:11:09',NULL,0,'Replaced Test 1762326668',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','326668');
INSERT INTO "users" VALUES(35,'final1762326726@secure.learning-notebook.local','final1762326726','passkey-user','2025-11-05 07:12:07',NULL,0,'Final Test 1762326726',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','326726');
INSERT INTO "users" VALUES(36,'@secure.learning-notebook.local','final1762326765','passkey-user','2025-11-05 07:12:46',NULL,0,'Final Test 1762326765',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','326765');
INSERT INTO "users" VALUES(37,'final1762326785@secure.learning-notebook.local','final1762326785','passkey-user','2025-11-05 07:13:05',NULL,0,'Final Test 1762326785',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','326785');
INSERT INTO "users" VALUES(38,'final1762326812@secure.learning-notebook.local','final1762326812','passkey-user','2025-11-05 07:13:33',NULL,0,'Final Test 1762326812',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','326812');
INSERT INTO "users" VALUES(39,'frontend-test-1762327045@secure.learning-notebook.local','frontend-test-1762327045','passkey-user','2025-11-05 07:17:25',NULL,0,'Frontend Test 1762327045',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','327045');
INSERT INTO "users" VALUES(40,'real-test-1762327596@test.local','real-test-1762327596','passkey-user','2025-11-05 07:26:36',NULL,0,'Real Test',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','327596');
INSERT INTO "users" VALUES(41,'real-state-test-1762328004@test.local','real-state-test-1762328004','passkey-user','2025-11-05 07:33:24',NULL,0,'Real State Test',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？','328004');
INSERT INTO "users" VALUES(42,'-2@secure.learning-notebook.local','-2','passkey-user','2025-11-05 07:33:33',NULL,0,'Real State Test 2',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
INSERT INTO "users" VALUES(43,'test@final.local','final-test-2024','passkey-user','2025-11-05 07:36:20',NULL,0,'Final Test',NULL,NULL,NULL,0,0,NULL,NULL,'color','#3498db',NULL,NULL,0,0,'あなたの好きなアニメキャラは？',NULL);
CREATE TABLE user_progress (
    user_id INTEGER,
    subject TEXT,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, subject),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT INTO "user_progress" VALUES(1,'english-vocabulary',25,20,20,5,5,'2025-10-16 04:26:12');
INSERT INTO "user_progress" VALUES(1,'math',15,12,12,3,3,'2025-10-15 04:26:12');
INSERT INTO "user_progress" VALUES(2,'english-grammar',10,7,7,2,2,'2025-10-14 04:26:12');
INSERT INTO "user_progress" VALUES(11,'math',10,8,8,0,0,'2025-10-17 05:26:37');
CREATE TABLE study_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    subject TEXT,
    score INTEGER,
    total_questions INTEGER,
    accuracy REAL,
    duration_minutes INTEGER,
    completed_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
INSERT INTO "study_sessions" VALUES(1,1,'english-vocabulary',5,5,100,10,'2025-10-16 04:26:12');
INSERT INTO "study_sessions" VALUES(2,1,'english-vocabulary',4,5,80,12,'2025-10-16 04:26:12');
INSERT INTO "study_sessions" VALUES(3,1,'math',3,4,75,8,'2025-10-15 04:26:12');
INSERT INTO "study_sessions" VALUES(4,2,'english-grammar',3,5,60,15,'2025-10-14 04:26:12');
INSERT INTO "study_sessions" VALUES(5,11,'math',8,10,80,15,'2025-10-17 05:26:37');
CREATE TABLE note_questions (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  title TEXT,
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  source TEXT DEFAULT 'learning-notebook',
  word TEXT,
  is_listening INTEGER DEFAULT 0,
  difficulty_level TEXT DEFAULT 'medium',
  mode TEXT,
  choices TEXT,
  media_urls TEXT,
  explanation TEXT,
  tags TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  is_deleted INTEGER DEFAULT 0
, passage_id TEXT, question_order INTEGER, passage_script TEXT, passage_explanation TEXT);
INSERT INTO "note_questions" VALUES('chemistry-001','chemistry','水の化学式','水の化学式は？','$\\text{H}_2\\text{O}$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-002','chemistry','酸素の化学式','酸素の化学式は？','$\\text{O}_2$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-003','chemistry','二酸化炭素の化学式','二酸化炭素の化学式は？','$\\text{CO}_2$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-004','chemistry','食塩の化学式','食塩の化学式は？','$\\text{NaCl}$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-005','chemistry','アンモニアの化学式','アンモニアの化学式は？','$\\text{NH}_3$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-006','chemistry','メタンの化学式','メタンの化学式は？','$\\text{CH}_4$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-007','chemistry','硫酸の化学式','硫酸の化学式は？','$\\text{H}_2\\text{SO}_4$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-008','chemistry','過酸化水素の化学式','過酸化水素の化学式は？','$\\text{H}_2\\text{O}_2$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-009','chemistry','炭酸の化学式','炭酸の化学式は？','$\\text{H}_2\\text{CO}_3$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-010','chemistry','エタノールの化学式','エタノールの化学式は？','$\\text{C}_2\\text{H}_5\\text{OH}$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-011','chemistry','燃焼反応','燃焼反応: $\\text{CH}_4 + 2\\text{O}_2 \\rightarrow ?$','$\\text{CO}_2 + 2\\text{H}_2\\text{O}$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-012','chemistry','中和反応','中和反応: $\\text{HCl} + \\text{NaOH} \\rightarrow ?$','$\\text{NaCl} + \\text{H}_2\\text{O}$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-013','chemistry','光合成反応','光合成: $6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\rightarrow ?$','$\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-014','chemistry','理想気体の状態方程式','理想気体の状態方程式は？','$PV = nRT$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry-015','chemistry','モル濃度','モル濃度の式は？','$C = \\frac{n}{V}$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-grammar-001','english-grammar','Be動詞 am/is/are','I ___ a student. (am/is/are)','am','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-grammar-002','english-grammar','三人称単数現在','She ___ to school. (go/goes)','goes','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-grammar-003','english-grammar','複数形のbe動詞','They ___ playing soccer. (is/are)','are','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-grammar-004','english-grammar','三人称の否定文','He ___ not like coffee. (do/does)','does','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-grammar-005','english-grammar','過去形','過去形: I ___ happy yesterday. (am/was)','was','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-grammar-006','english-grammar','不規則複数形','複数形: child → ___','children','learning-notebook',NULL,0,'medium',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-grammar-007','english-grammar','不規則比較級','比較級: good → ___','better','learning-notebook',NULL,0,'medium',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-grammar-008','english-grammar','不規則最上級','最上級: bad → ___','worst','learning-notebook',NULL,0,'medium',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-grammar-009','english-grammar','疑問文 Do/Does','___ you speak English? (Do/Does)','Do','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-grammar-010','english-grammar','冠詞 a/an','I have ___ apple. (a/an)','an','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-listen-001','english-listening','apple リスニング','🔊 音声を聞いて答えてください','apple (りんご)','learning-notebook','apple',1,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-listen-002','english-listening','book リスニング','🔊 音声を聞いて答えてください','book (本)','learning-notebook','book',1,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-listen-003','english-listening','cat リスニング','🔊 音声を聞いて答えてください','cat (猫)','learning-notebook','cat',1,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-listen-004','english-listening','dog リスニング','🔊 音声を聞いて答えてください','dog (犬)','learning-notebook','dog',1,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-listen-005','english-listening','house リスニング','🔊 音声を聞いて答えてください','house (家)','learning-notebook','house',1,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-listen-006','english-listening','water リスニング','🔊 音声を聞いて答えてください','water (水)','learning-notebook','water',1,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-listen-007','english-listening','school リスニング','🔊 音声を聞いて答えてください','school (学校)','learning-notebook','school',1,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-listen-008','english-listening','friend リスニング','🔊 音声を聞いて答えてください','friend (友達)','learning-notebook','friend',1,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-listen-009','english-listening','beautiful リスニング','🔊 音声を聞いて答えてください','beautiful (美しい)','learning-notebook','beautiful',1,'medium',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-listen-010','english-listening','important リスニング','🔊 音声を聞いて答えてください','important (重要な)','learning-notebook','important',1,'medium',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-001','english-vocabulary','apple','apple','りんご','learning-notebook','apple',0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-002','english-vocabulary','book','book','本','learning-notebook','book',0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-003','english-vocabulary','cat','cat','猫','learning-notebook','cat',0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-004','english-vocabulary','dog','dog','犬','learning-notebook','dog',0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-005','english-vocabulary','house','house','家','learning-notebook','house',0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-006','english-vocabulary','water','water','水','learning-notebook','water',0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-007','english-vocabulary','school','school','学校','learning-notebook','school',0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-008','english-vocabulary','friend','friend','友達','learning-notebook','friend',0,'easy',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-009','english-vocabulary','beautiful','beautiful','美しい','learning-notebook','beautiful',0,'medium',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-010','english-vocabulary','important','important','重要な','learning-notebook','important',0,'medium',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-011','english-vocabulary','understand','understand','理解する','learning-notebook','understand',0,'medium',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-012','english-vocabulary','knowledge','knowledge','知識','learning-notebook','knowledge',0,'medium',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-013','english-vocabulary','experience','experience','経験','learning-notebook','experience',0,'medium',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-014','english-vocabulary','opportunity','opportunity','機会','learning-notebook','opportunity',0,'hard',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('en-vocab-015','english-vocabulary','accomplish','accomplish','達成する','learning-notebook','accomplish',0,'hard',NULL,NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-001','math','基本の足し算','$3 + 5 = ?$','$8$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-002','math','基本の掛け算','$12 \\times 7 = ?$','$84$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-003','math','平方根','$\\sqrt{16} = ?$','$4$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-004','math','累乗計算','$2^3 = ?$','$8$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-005','math','基本の引き算','$15 - 9 = ?$','$6$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-006','math','基本の割り算','$48 \\div 6 = ?$','$8$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-007','math','累乗計算2','$5^2 = ?$','$25$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-008','math','割り算2','$100 \\div 4 = ?$','$25$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-009','math','九九の応用','$9 \\times 9 = ?$','$81$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-010','math','平方根2','$\\sqrt{25} = ?$','$5$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-011','math','分数の足し算','$\\frac{3}{4} + \\frac{1}{2} = ?$','$\\frac{5}{4}$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-012','math','微分積分','$\\int x^2 dx = ?$','$\\frac{x^3}{3} + C$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-013','math','極限','$\\lim_{x \\to 0} \\frac{\\sin x}{x} = ?$','$1$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-014','math','オイラーの公式','$e^{i\\pi} + 1 = ?$','$0$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math-015','math','級数','$\\sum_{n=1}^{10} n = ?$','$55$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-001','physics','速度の単位','速度の単位は？','$\\text{m/s}$ (メートル毎秒)','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-002','physics','重力加速度','重力加速度は？','$9.8 \\, \\text{m/s}^2$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-003','physics','運動エネルギー','運動エネルギーの式は？','$\\frac{1}{2}mv^2$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-004','physics','力の単位','力の単位は？','$\\text{N}$ (ニュートン)','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-005','physics','光速','光の速さは？','$3 \\times 10^8 \\, \\text{m/s}$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-006','physics','位置エネルギー','位置エネルギーの式は？','$mgh$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-007','physics','仕事の単位','仕事の単位は？','$\\text{J}$ (ジュール)','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-008','physics','電流の単位','電流の単位は？','$\\text{A}$ (アンペア)','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-009','physics','オームの法則','オームの法則は？','$V = IR$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-010','physics','電力の公式','電力の式は？','$P = VI$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-011','physics','運動方程式','運動方程式は？','$F = ma$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-012','physics','万有引力の法則','万有引力の式は？','$F = G\\frac{m_1 m_2}{r^2}$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-013','physics','波の速度','波の速さの式は？','$v = f\\lambda$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-014','physics','理想気体の状態方程式','理想気体の状態方程式は？','$PV = nRT$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics-015','physics','クーロンの法則','クーロンの法則は？','$F = k\\frac{q_1 q_2}{r^2}$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,'2025-10-17 04:20:37','2025-10-17 04:20:37',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('q_1760679767635_epzgr8xz4','english-listening','apple','?','B','learning-notebook',NULL,1,'listen_todai','multiple_choice','["A","B","C","D"]','["https://pub-3e45f268c1214f3cb9503d996a985f3c.r2.dev/assets/audio/english-listening/1760679762723_urba6uqd.wav"]',NULL,NULL,'2025-10-17T05:42:47.635Z','2025-10-17T05:42:44.332Z',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('q_test_5choice_001','english-listening','Submarine Cable Lecture','(1) What is the central purpose of this lecture?','C','learning-notebook',NULL,1,'listen_todai','multiple_choice','["a) To warn about the security risks and vulnerabilities of the modern internet.","b) To compare the advantages of satellite communication with those of undersea cables.","c) To outline the key technological and historical stages in the development of submarine communication cables.","d) To detail the business history of the telecommunication companies that laid the first cables.","e) To explain the scientific principles behind fiber-optic technology and gutta-percha insulation."]',NULL,'The lecture focuses on the historical and technological development of submarine cables.','["listening","history","technology"]','2025-10-17T10:00:00.000Z','2025-10-17T14:58:23.102Z',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('todai_sample_001_q1','english-listening','Submarine Cable Lecture','(1) What is the central purpose of this lecture?','C','learning-notebook',NULL,1,'listen_todai','multiple_choice','["a) To warn about the security risks and vulnerabilities of the modern internet.","b) To compare the advantages of satellite communication with those of undersea cables.","c) To outline the key technological and historical stages in the development of submarine communication cables.","d) To detail the business history of the telecommunication companies that laid the first cables.","e) To explain the scientific principles behind fiber-optic technology and gutta-percha insulation."]','["https://pub-3e45f268c1214f3cb9503d996a985f3c.r2.dev/assets/audio/sample_lecture.mp3"]','The lecture focuses on the historical and technological development of submarine cables.',NULL,'2025-10-17T15:27:40.824Z','2025-10-17T17:42:28.660Z',1,'todai_sample_001',1,NULL,NULL);
INSERT INTO "note_questions" VALUES('todai_sample_001_q2','english-listening','Submarine Cable Lecture','(2) According to the lecture, what was a major challenge in early submarine cable projects?','A','learning-notebook',NULL,1,'listen_todai','multiple_choice','["a) Finding materials that could insulate cables under extreme ocean pressures.","b) Convincing investors that the technology would be profitable.","c) Training engineers to repair broken cables on the ocean floor.","d) Preventing interference from satellite communications.","e) Competing with telegraph services on land."]','["https://pub-3e45f268c1214f3cb9503d996a985f3c.r2.dev/assets/audio/sample_lecture.mp3"]','Early projects struggled with insulation materials capable of withstanding ocean conditions.',NULL,'2025-10-17T15:27:40.871Z','2025-10-17T17:42:28.760Z',1,'todai_sample_001',2,NULL,NULL);
INSERT INTO "note_questions" VALUES('todai_sample_001_q3','english-listening','Submarine Cable Lecture','(3) Which innovation was most crucial for modern high-speed internet cables?','B','learning-notebook',NULL,1,'listen_todai','multiple_choice','["a) The use of copper instead of fiber optics.","b) The development of fiber-optic technology.","c) The introduction of wireless signal boosters.","d) The establishment of international cable-laying treaties.","e) The creation of solar-powered relay stations."]','["https://pub-3e45f268c1214f3cb9503d996a985f3c.r2.dev/assets/audio/sample_lecture.mp3"]','Fiber-optic technology enabled the high-speed data transmission required for modern internet.',NULL,'2025-10-17T15:27:40.905Z','2025-10-17T17:42:28.860Z',1,'todai_sample_001',3,NULL,NULL);
INSERT INTO "note_questions" VALUES('1760717100257_q1','english-listening','?','?','B','learning-notebook',NULL,1,'listen_todai','multiple_choice','["?","?","?","?","?"]','["https://pub-3e45f268c1214f3cb9503d996a985f3c.r2.dev/assets/audio/listening/1760717096975_gpefdg1u.mp3"]','?',NULL,'2025-10-17T16:04:57.952Z','2025-10-17T17:42:10.150Z',1,'todai_1760717101470',1,'?','?');
INSERT INTO "note_questions" VALUES('1760720273991_q1','english-listening','これから放送するのは、海底ケーブルの歴史に関する講義である。','What is the central purpose of this lecture?','C','learning-notebook',NULL,1,'listen_todai','multiple_choice','["To warn about the security risks and vulnerabilities of the modern internet.","To compare the advantages of satellite communication with those of undersea cables.","To outline the key technological and historical stages in the development of submarine communication cables.","To detail the business history of the telecommunication companies that laid the first cables.","To explain the scientific principles behind fiber-optic technology and gutta-percha."]','["https://pub-3e45f268c1214f3cb9503d996a985f3c.r2.dev/assets/audio/listening/1760720273434_sp42yhcl.wav"]',replace('この講義は、電信時代から始まり、電話ケーブル、そして現代の光ファイバーケーブルへと至る、海底ケーブルの技術的、歴史的な発展段階を順を追って説明しています。講義全体を通して、この歴史的な変遷が中心的なテーマとなっているため、c) が最も適切です。\n\n誤答分析: a) は講義の結論部分で触れられていますが、主題ではありません。b) は冒頭で衛星通信と比較していますが、講義の主要な内容ではありません。d) や e) は講義に含まれる要素ですが、全体を包括するテーマとしては狭すぎます。','\n',char(10)),NULL,'2025-10-17T16:57:56.128Z','2025-10-17T16:57:56.128Z',0,'todai_1760720279838',1,replace('Good morning. When you send an email, stream a video, or make an international call, have you ever considered the physical journey that data takes? You might imagine satellites orbiting the Earth, but in fact, over 99% of all international data is transmitted through a vast, unseen network of cables lying on the ocean floor. Today, we''re going to dive into the history of this remarkable infrastructure.\n\nThe story begins in the age of the telegraph. In the mid-19th century, the idea of connecting continents with a wire seemed like science fiction. The challenges were immense: designing a cable that could withstand immense water pressure and salty corrosion, and finding a ship large enough to carry thousands of kilometers of it. Early attempts in the 1850s to lay a transatlantic cable were plagued by failures; cables snapped under their own weight or simply stopped working. The breakthrough came with two key innovations. First, a natural plastic called gutta-percha, derived from a Southeast Asian tree, proved to be an excellent and durable electrical insulator for the copper core. Second, after a failed attempt in 1865, the largest ship in the world at the time, the SS Great Eastern, was successfully used in 1866 to lay the first permanent, reliable transatlantic telegraph cable. This single event revolutionized global communication, reducing the time to send a message from Europe to North America from ten days by ship to just a few minutes by telegraph.\n\nFor the next century, the world was wired for telegraphy. The British Empire, in particular, created a network known as the "All Red Line" to connect its colonies, ensuring secure communication without relying on other nations'' infrastructure. However, transmitting voice, for the telephone, was a much greater challenge. A telegraph signal is a simple on-off pulse. A voice signal is a complex wave that weakens over distance and requires amplification. It wasn''t until 1956 that the first transatlantic telephone cable, TAT-1, was laid. Its key technology was the repeater—amplifiers placed every 70 kilometers along the cable to boost the signal. It was a technological marvel, but its capacity was limited to just 36 simultaneous phone calls.\n\nThe next great leap came with the invention of fiber-optic technology. Instead of sending electrical signals through copper, fiber-optic cables transmit data as pulses of light through thin strands of glass. The first transatlantic fiber-optic cable, TAT-8, went into service in 1988. Its capacity was astounding for the time, able to handle 40,000 simultaneous phone calls—more than a thousand times the capacity of its copper predecessor from just 30 years earlier. This innovation laid the groundwork for the modern internet. The internet boom of the late 1990s led to a frenzy of cable-laying by telecommunication companies.\n\nToday, this undersea network is more critical than ever. The cables themselves are surprisingly thin, typically the diameter of a garden hose. Yet, they are the backbone of the global economy. This reliance, however, also creates a vulnerability. While stories of sharks biting cables are largely a myth from the past, damage from ship anchors and fishing trawlers is a constant threat, causing dozens of service interruptions every year. Furthermore, the high concentration of cable landing points in a few key locations makes them a point of geopolitical concern. The story of submarine cables is a story of human ingenuity, but it also serves as a reminder that our seemingly borderless digital world is built upon a very real and fragile physical foundation.\n\n（日本語訳）\nおはようございます。皆さんがEメールを送ったり、ビデオをストリーミングしたり、国際電話をかけたりするとき、そのデータがどのような物理的な旅をしているか考えたことはありますか？地球を周回する衛星を想像するかもしれませんが、実際には、全ての国際データの99%以上が、海底に敷設された広大で見えないケーブル網を通じて送信されています。本日は、この驚くべきインフラの歴史を深く掘り下げていきましょう。\n\n物語は電信の時代に始まります。19世紀半ば、大陸を電線で繋ぐというアイデアはサイエンスフィクションのように思われていました。課題は山積みでした。巨大な水圧と塩水による腐食に耐えうるケーブルの設計、そして何千キロものケーブルを運べる大きさの船を見つけることなどです。1850年代の大西洋横断ケーブル敷設の初期の試みは、失敗続きでした。ケーブルは自重で切れ、あるいは単に機能しなくなりました。\n\n転機は2つの重要な技術革新によってもたらされました。第一に、東南アジアの木から採れるグタペルカという天然プラスチックが、銅線の芯にとって優れた耐久性のある電気絶縁体であることが証明されました。第二に、1865年の失敗の後、当時世界最大の船であったSSグレート・イースタン号が、1866年に初となる恒久的で信頼性のある大西洋横断電信ケーブルの敷設に成功裏に用いられたのです。この一つの出来事が世界の通信に革命をもたらし、ヨーロッパから北米へメッセージを送る時間を、船での10日間から電信でのわずか数分へと短縮しました。\n\n次の1世紀の間、世界は電信で結ばれました。特に大英帝国は、「オール・レッド・ライン」として知られるネットワークを構築して植民地を結び、他国のインフラに頼ることなく安全な通信を確保しました。しかし、電話の音声を伝送することは、はるかに大きな挑戦でした。電信信号は単純なオン・オフのパルスです。音声信号は複雑な波であり、距離とともに弱まり、増幅を必要とします。\n\n初の大西洋横断電話ケーブル、TAT-1が敷設されたのは1956年になってからでした。その主要技術はリピータ（中継器）でした。信号を増強するためにケーブルに沿って70キロメートルごとに設置された増幅器です。それは技術的な驚異でしたが、その容量はわずか36の同時通話に限定されていました。\n\n次の大きな飛躍は、光ファイバー技術の発明によってもたらされました。銅線を通して電気信号を送る代わりに、光ファイバーケーブルは、細いガラスの束を通して光のパルスとしてデータを送信します。初の光ファイバー大西洋横断ケーブルであるTAT-8は1988年に運用を開始しました。その容量は当時としては驚異的で、4万の同時通話に対応できました。これはわずか30年前の銅線の前任者の1000倍以上の容量です。この技術革新が、現代のインターネットの基礎を築きました。1990年代後半のインターネットブームは、通信会社によるケーブル敷設の熱狂へとつながりました。\n\n今日、この海底ネットワークはこれまで以上に重要です。ケーブル自体は驚くほど細く、通常は庭のホースほどの直径です。しかし、それらは世界経済のバックボーン（基幹）なのです。しかし、この依存は脆弱性も生み出します。サメがケーブルを噛むという話は主に過去の神話ですが、船の錨や漁業用のトロール網による損傷は絶え間ない脅威であり、毎年数十件のサービス中断を引き起こしています。さらに、ケーブルの陸揚げ地点が少数の主要な場所に集中していることは、地政学的な懸念材料となっています。海底ケーブルの物語は人類の創意工夫の物語ですが、同時に、一見すると国境のない我々のデジタル世界が、非常に現実的で壊れやすい物理的な基盤の上に築かれていることを思い出させてくれるものでもあるのです。','\n',char(10)),NULL);
INSERT INTO "note_questions" VALUES('1760720273991_q2','english-listening','これから放送するのは、海底ケーブルの歴史に関する講義である。','According to the lecturer, what was the primary innovation that made the first transatlantic telephone cable (TAT-1) possible in 1956?','C','learning-notebook',NULL,1,'listen_todai','multiple_choice','["The use of the SS Great Eastern to carry the massive cable.","The invention of gutta-percha as a reliable insulating material.","The development of repeaters to amplify the voice signal over long distances.","The creation of the \"All Red Line\" to fund the expensive project.","The discovery of a new, shorter route across the Atlantic Ocean."]','["https://pub-3e45f268c1214f3cb9503d996a985f3c.r2.dev/assets/audio/listening/1760720273434_sp42yhcl.wav"]',replace('講義の中盤で、初の電話ケーブルであるTAT-1について、「その主要技術はリピータ（中継器）でした。信号を増強するためにケーブルに沿って70キロメートルごとに設置された増幅器です」と明確に述べられています。これにより、減衰してしまう音声信号を長距離伝送することが可能になりました。\n\n誤答分析: a) と b) は、それより前の電信ケーブル（1866年）の成功要因であり、電話ケーブル（1956年）の革新技術ではありません。このように時代や技術の対象をずらしてくるのが東大リスニングの典型的な引っかけです。d) と e) は本文に記載がありません。','\n',char(10)),NULL,'2025-10-17T16:57:56.884Z','2025-10-17T16:57:56.884Z',0,'todai_1760720279838',2,NULL,NULL);
INSERT INTO "note_questions" VALUES('1760720273991_q3','english-listening','これから放送するのは、海底ケーブルの歴史に関する講義である。','The lecturer mentions the "All Red Line." What can be inferred about the British Empire''s motivation for creating this network?','C','learning-notebook',NULL,1,'listen_todai','multiple_choice','["They wanted to create a global telegraph network that was open and free for all nations to use.","They were primarily interested in the scientific challenge of connecting their most remote territories.","They sought to establish a communications network that was strategically independent and not reliant on potential rivals.","They aimed to make a profit by charging other countries high fees to use their cable system.","Their main goal was to map the ocean floor for future resource exploration."]','["https://pub-3e45f268c1214f3cb9503d996a985f3c.r2.dev/assets/audio/listening/1760720273434_sp42yhcl.wav"]',replace('解説: 「オール・レッド・ライン」について、「大英帝国は植民地を結ぶためにこのネットワークを構築し、他国のインフラに頼ることなく安全な通信を確保した」と述べられています。この記述から、戦略的な自立性と、潜在的なライバル国に依存しない通信網を確保することが主な動機であったと推測できます。inferred（推測される）と問われている通り、直接的な表現ではなく文脈から意図を読み取る必要があります。\n\n誤答分析: a), b), d), e) は、本文の記述からは裏付けられない動機です。特に a) は「安全な通信を確保した」という本文の趣旨とは逆です。','\n',char(10)),NULL,'2025-10-17T16:57:56.921Z','2025-10-17T16:57:56.921Z',0,'todai_1760720279838',3,NULL,NULL);
INSERT INTO "note_questions" VALUES('1760720273991_q4','english-listening','これから放送するのは、海底ケーブルの歴史に関する講義である。','Which of the following is NOT mentioned as a stage in the evolution of submarine cables?','C','learning-notebook',NULL,1,'listen_todai','multiple_choice','["Early, unsuccessful attempts in the 1850s to lay a telegraph cable.","The first successful transatlantic telegraph cable in 1866.","The laying of the first telephone cable capable of handling thousands of calls in the 1950s.","The introduction of the first fiber-optic cable in 1988, dramatically increasing data capacity.","A massive expansion of the fiber-optic network driven by the internet boom."]','["https://pub-3e45f268c1214f3cb9503d996a985f3c.r2.dev/assets/audio/listening/1760720273434_sp42yhcl.wav"]',replace('解説: この問題は、本文で言及されていないこと（NOT mentioned）を問う、典型的な消去法を要求する問題です。TAT-1（初の電話ケーブル）について、講義では「容量はわずか36の同時通話に限定されていました」と述べられています。「何千もの通話」に対応できたわけではないため、c) が本文の内容と一致しません。\n\n誤答分析: a), b), d), e) はすべて講義内で明確に言及されている歴史的な段階です。\n\na) → "Early attempts in the 1850s ... were plagued by failures"\n\nb) → "...successfully used in 1866 to lay the first permanent, reliable transatlantic telegraph cable."\n\nd) → "...first transatlantic fiber-optic cable, TAT-8, went into service in 1988..."\n\ne) → "The internet boom of the late 1990s led to a frenzy of cable-laying..."','\n',char(10)),NULL,'2025-10-17T16:57:56.955Z','2025-10-17T16:57:56.955Z',0,'todai_1760720279838',4,NULL,NULL);
INSERT INTO "note_questions" VALUES('1760720273991_q5','english-listening','これから放送するのは、海底ケーブルの歴史に関する講義である。','At the end of the lecture, what does the speaker suggest about our modern digital world?','D','learning-notebook',NULL,1,'listen_todai','multiple_choice','["It is becoming less dependent on physical infrastructure thanks to wireless technology.","It is surprisingly resilient and can withstand major disruptions to its cable network.","Its greatest threat comes from sharks and other marine life damaging the cables.","Its global connectivity is fundamentally reliant on a physical and vulnerable network of undersea cables.","It is now primarily controlled by large technology companies rather than national governments."]','["https://pub-3e45f268c1214f3cb9503d996a985f3c.r2.dev/assets/audio/listening/1760720273434_sp42yhcl.wav"]',replace('解説: 講義の結論部分で、「船の錨や漁業用のトロール網による損傷は絶え間ない脅威である」「ケーブルの陸揚げ地点が少数の主要な場所に集中していることは、地政学的な懸念材料となっている」と述べられています。そして最後に、「一見すると国境のない我々のデジタル世界が、非常に現実的で壊れやすい物理的な基盤の上に築かれていることを思い出させてくれる」と締めくくられています。このことから、d) が講師の最終的な見解として最も適切です。\n\n誤答分析: a) は「99%以上のデータはケーブルを通る」という冒頭の記述と矛盾します。b) は「脆弱である(fragile)」という本文の記述と逆です。c) は「サメがケーブルを噛む話は主に過去の神話だ」と本文で否定されています。e) は本文では直接言及されていません。','\n',char(10)),NULL,'2025-10-17T16:57:56.991Z','2025-10-17T16:57:56.991Z',0,'todai_1760720279838',5,NULL,NULL);
INSERT INTO "note_questions" VALUES('test_1761908829','english-listening','テスト問題','これはテストです','A','learning-notebook',NULL,1,'listen_general','multiple_choice','["選択肢A","選択肢B","選択肢C","選択肢D"]',NULL,NULL,NULL,'2025-10-31T11:07:09.328Z','2025-10-31T11:07:09.328Z',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('test_passage_1761908829_q1','english-listening','テストパッセージです。','最初の問題ですか？','A','learning-notebook',NULL,1,'listen_todai','multiple_choice','["はい","いいえ","わからない","その他"]','["https://example.com/test.wav"]',NULL,NULL,'2025-10-31T11:07:50.412Z','2025-10-31T11:07:50.412Z',0,'test_passage_1761908829',1,NULL,NULL);
INSERT INTO "note_questions" VALUES('test_passage_1761908829_q2','english-listening','テストパッセージです。','2番目の問題ですか？','B','learning-notebook',NULL,1,'listen_todai','multiple_choice','["はい","いいえ","わからない","その他"]','["https://example.com/test.wav"]',NULL,NULL,'2025-10-31T11:07:50.456Z','2025-10-31T11:07:50.456Z',0,'test_passage_1761908829',2,NULL,NULL);
INSERT INTO "note_questions" VALUES('vocab_test_1761909247','english-vocabulary','更新テスト','updated','更新されました','learning-notebook','updated',0,'medium',NULL,NULL,NULL,'更新テストです',NULL,'2025-10-31T11:14:07.271Z','2025-10-31T11:31:40.396Z',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('grammar_test_1761909247','english-grammar','Be動詞テスト','He ___ a teacher. (am/is/are)','B','learning-notebook',NULL,0,'easy','multiple_choice','["am","is","are","be"]',NULL,NULL,NULL,'2025-10-31T11:14:44.800Z','2025-10-31T11:14:44.800Z',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('math_test_1761909500','math','二次方程式テスト','$x^2 + 2x + 1 = 0$ の解は？','$x = -1$','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,'$x^2 + 2x + 1 = (x+1)^2 = 0$ なので $x = -1$ です。','"[\"algebra\"]"','2025-10-31T11:24:17.637Z','2025-10-31T11:24:17.637Z',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('physics_test_1761909500','physics','運動方程式テスト','質量 $m$ の物体に力 $F$ が働くとき、加速度 $a$ は？','$a = \frac{F}{m}$','learning-notebook',NULL,0,'medium',NULL,NULL,NULL,'ニュートンの第二法則より $F = ma$ なので $a = F/m$ です。','"[\"mechanics\"]"','2025-10-31T11:24:35.993Z','2025-10-31T11:24:35.993Z',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('chemistry_test_1761909500','chemistry','化学式テスト','メタンの化学式は？','$\text{CH}_4$','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,'メタンは炭素原子1個と水素原子4個が結合した化合物です。','"[\"organic\"]"','2025-10-31T11:24:58.010Z','2025-10-31T11:24:58.010Z',0,NULL,NULL,NULL,NULL);
INSERT INTO "note_questions" VALUES('integration_test_1761909800','math','積分テスト','$\int x^2 dx$ は？','$\frac{x^3}{3} + C$','learning-notebook',NULL,0,'hard',NULL,NULL,NULL,'積分公式 $\int x^n dx = \frac{x^{n+1}}{n+1} + C$ です。','"[\"calculus\"]"','2025-10-31T11:33:57.688Z','2025-10-31T11:33:57.688Z',0,NULL,NULL,NULL,NULL);
CREATE TABLE questions (
    id TEXT PRIMARY KEY,
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    question_text TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    source TEXT DEFAULT 'learning-notebook',
    word TEXT,
    is_listening BOOLEAN DEFAULT 0,
    difficulty_level TEXT DEFAULT 'medium',
    mode TEXT,
    choices TEXT, -- JSON array
    media_urls TEXT, -- JSON array
    explanation TEXT,
    tags TEXT, -- JSON array
    active BOOLEAN DEFAULT 1,
    is_deleted BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
INSERT INTO "questions" VALUES('en-vocab-001','english-vocabulary','apple','apple','りんご','learning-notebook','apple',0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-002','english-vocabulary','book','book','本','learning-notebook','book',0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-003','english-vocabulary','cat','cat','猫','learning-notebook','cat',0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-004','english-vocabulary','dog','dog','犬','learning-notebook','dog',0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-005','english-vocabulary','house','house','家','learning-notebook','house',0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-006','english-vocabulary','water','water','水','learning-notebook','water',0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-007','english-vocabulary','school','school','学校','learning-notebook','school',0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-008','english-vocabulary','friend','friend','友達','learning-notebook','friend',0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-009','english-vocabulary','beautiful','beautiful','美しい','learning-notebook','beautiful',0,'medium',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-010','english-vocabulary','important','important','重要な','learning-notebook','important',0,'medium',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-011','english-vocabulary','understand','understand','理解する','learning-notebook','understand',0,'medium',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-012','english-vocabulary','knowledge','knowledge','知識','learning-notebook','knowledge',0,'medium',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-013','english-vocabulary','experience','experience','経験','learning-notebook','experience',0,'medium',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-014','english-vocabulary','opportunity','opportunity','機会','learning-notebook','opportunity',0,'hard',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-vocab-015','english-vocabulary','accomplish','accomplish','達成する','learning-notebook','accomplish',0,'hard',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-grammar-001','english-grammar','Be動詞 am/is/are','I ___ a student. (am/is/are)','am','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-grammar-002','english-grammar','三人称単数現在','She ___ to school. (go/goes)','goes','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-grammar-003','english-grammar','複数形のbe動詞','They ___ playing soccer. (is/are)','are','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-grammar-004','english-grammar','三人称の否定文','He ___ not like coffee. (do/does)','does','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-grammar-005','english-grammar','過去形','過去形: I ___ happy yesterday. (am/was)','was','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-grammar-006','english-grammar','不規則複数形','複数形: child → ___','children','learning-notebook',NULL,0,'medium',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-grammar-007','english-grammar','不規則比較級','比較級: good → ___','better','learning-notebook',NULL,0,'medium',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-grammar-008','english-grammar','不規則最上級','最上級: bad → ___','worst','learning-notebook',NULL,0,'medium',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-grammar-009','english-grammar','疑問文 Do/Does','___ you speak English? (Do/Does)','Do','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-grammar-010','english-grammar','冠詞 a/an','I have ___ apple. (a/an)','an','learning-notebook',NULL,0,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-listen-001','english-listening','apple リスニング','🔊 音声を聞いて答えてください','apple (りんご)','learning-notebook','apple',1,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-listen-002','english-listening','book リスニング','🔊 音声を聞いて答えてください','book (本)','learning-notebook','book',1,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-listen-003','english-listening','cat リスニング','🔊 音声を聞いて答えてください','cat (猫)','learning-notebook','cat',1,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-listen-004','english-listening','dog リスニング','🔊 音声を聞いて答えてください','dog (犬)','learning-notebook','dog',1,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-listen-005','english-listening','house リスニング','🔊 音声を聞いて答えてください','house (家)','learning-notebook','house',1,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-listen-006','english-listening','water リスニング','🔊 音声を聞いて答えてください','water (水)','learning-notebook','water',1,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-listen-007','english-listening','school リスニング','🔊 音声を聞いて答えてください','school (学校)','learning-notebook','school',1,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-listen-008','english-listening','friend リスニング','🔊 音声を聞いて答えてください','friend (友達)','learning-notebook','friend',1,'easy',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-listen-009','english-listening','beautiful リスニング','🔊 音声を聞いて答えてください','beautiful (美しい)','learning-notebook','beautiful',1,'medium',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('en-listen-010','english-listening','important リスニング','🔊 音声を聞いて答えてください','important (重要な)','learning-notebook','important',1,'medium',NULL,NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-001','math','基本の足し算','$3 + 5 = ?$','$8$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-002','math','基本の掛け算','$12 \\times 7 = ?$','$84$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-003','math','平方根','$\\sqrt{16} = ?$','$4$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-004','math','累乗計算','$2^3 = ?$','$8$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-005','math','基本の引き算','$15 - 9 = ?$','$6$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-006','math','基本の割り算','$48 \\div 6 = ?$','$8$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-007','math','累乗計算2','$5^2 = ?$','$25$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-008','math','割り算2','$100 \\div 4 = ?$','$25$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-009','math','九九の応用','$9 \\times 9 = ?$','$81$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-010','math','平方根2','$\\sqrt{25} = ?$','$5$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-011','math','分数の足し算','$\\frac{3}{4} + \\frac{1}{2} = ?$','$\\frac{5}{4}$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-012','math','微分積分','$\\int x^2 dx = ?$','$\\frac{x^3}{3} + C$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-013','math','極限','$\\lim_{x \\to 0} \\frac{\\sin x}{x} = ?$','$1$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-014','math','オイラーの公式','$e^{i\\pi} + 1 = ?$','$0$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('math-015','math','級数','$\\sum_{n=1}^{10} n = ?$','$55$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-001','physics','速度の単位','速度の単位は？','$\\text{m/s}$ (メートル毎秒)','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-002','physics','重力加速度','重力加速度は？','$9.8 \\, \\text{m/s}^2$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-003','physics','運動エネルギー','運動エネルギーの式は？','$\\frac{1}{2}mv^2$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-004','physics','力の単位','力の単位は？','$\\text{N}$ (ニュートン)','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-005','physics','光速','光の速さは？','$3 \\times 10^8 \\, \\text{m/s}$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-006','physics','位置エネルギー','位置エネルギーの式は？','$mgh$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-007','physics','仕事の単位','仕事の単位は？','$\\text{J}$ (ジュール)','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-008','physics','電流の単位','電流の単位は？','$\\text{A}$ (アンペア)','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-009','physics','オームの法則','オームの法則は？','$V = IR$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-010','physics','電力の公式','電力の式は？','$P = VI$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-011','physics','運動方程式','運動方程式は？','$F = ma$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-012','physics','万有引力の法則','万有引力の式は？','$F = G\\frac{m_1 m_2}{r^2}$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-013','physics','波の速度','波の速さの式は？','$v = f\\lambda$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-014','physics','理想気体の状態方程式','理想気体の状態方程式は？','$PV = nRT$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('physics-015','physics','クーロンの法則','クーロンの法則は？','$F = k\\frac{q_1 q_2}{r^2}$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-001','chemistry','水の化学式','水の化学式は？','$\\text{H}_2\\text{O}$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-002','chemistry','酸素の化学式','酸素の化学式は？','$\\text{O}_2$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-003','chemistry','二酸化炭素の化学式','二酸化炭素の化学式は？','$\\text{CO}_2$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-004','chemistry','食塩の化学式','食塩の化学式は？','$\\text{NaCl}$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-005','chemistry','アンモニアの化学式','アンモニアの化学式は？','$\\text{NH}_3$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-006','chemistry','メタンの化学式','メタンの化学式は？','$\\text{CH}_4$','learning-notebook',NULL,0,'easy','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-007','chemistry','硫酸の化学式','硫酸の化学式は？','$\\text{H}_2\\text{SO}_4$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-008','chemistry','過酸化水素の化学式','過酸化水素の化学式は？','$\\text{H}_2\\text{O}_2$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-009','chemistry','炭酸の化学式','炭酸の化学式は？','$\\text{H}_2\\text{CO}_3$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-010','chemistry','エタノールの化学式','エタノールの化学式は？','$\\text{C}_2\\text{H}_5\\text{OH}$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-011','chemistry','燃焼反応','燃焼反応: $\\text{CH}_4 + 2\\text{O}_2 \\rightarrow ?$','$\\text{CO}_2 + 2\\text{H}_2\\text{O}$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-012','chemistry','中和反応','中和反応: $\\text{HCl} + \\text{NaOH} \\rightarrow ?$','$\\text{NaCl} + \\text{H}_2\\text{O}$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-013','chemistry','光合成反応','光合成: $6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\rightarrow ?$','$\\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-014','chemistry','理想気体の状態方程式','理想気体の状態方程式は？','$PV = nRT$','learning-notebook',NULL,0,'hard','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
INSERT INTO "questions" VALUES('chemistry-015','chemistry','モル濃度','モル濃度の式は？','$C = \\frac{n}{V}$','learning-notebook',NULL,0,'medium','katex',NULL,NULL,NULL,NULL,1,0,'2025-10-17 04:20:37','2025-10-17 04:20:37');
CREATE TABLE webauthn_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge TEXT NOT NULL,
    user_id INTEGER NOT NULL,
    operation_type TEXT NOT NULL CHECK (operation_type IN ('registration', 'authentication')),
    used BOOLEAN DEFAULT 0,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO "webauthn_challenges" VALUES(1,'f5e4ba073f1bba2dc2aae9519d8bbad19c6ef7d25d23ff4fd888df6fe9c04881',7,'registration',0,'2025-10-17T05:22:53.223Z','2025-10-17 05:17:53');
INSERT INTO "webauthn_challenges" VALUES(2,'03274635a34bbf3d0cc626aceb9ac8d32aca263f14f7d3d449744de879edc214',9,'registration',0,'2025-10-17T05:27:21.891Z','2025-10-17 05:22:21');
INSERT INTO "webauthn_challenges" VALUES(3,'e2f966649ee53c36c19bbaae39269c361469b76988fa185b5d2a18ab50baa38f',10,'registration',0,'2025-10-17T05:30:28.843Z','2025-10-17 05:25:28');
INSERT INTO "webauthn_challenges" VALUES(4,'1a41ed28d8e71782fca85b9e96202e555bd602b00ddafe238f952159dd36941f',14,'registration',0,'2025-10-17T05:37:07.634Z','2025-10-17 05:32:07');
INSERT INTO "webauthn_challenges" VALUES(5,'1576bab69c1352ed508310d59619821d9dade5cee2f1bb40ac8ff168314d79a1',17,'registration',0,'2025-10-17T05:49:12.181Z','2025-10-17 05:44:12');
INSERT INTO "webauthn_challenges" VALUES(6,'71b18aae2beead305b6adb1b8c3bd0f96b392e04d1e95000124a3df5679762d2',1,'registration',0,'2025-10-17T05:50:40.219Z','2025-10-17 05:45:40');
INSERT INTO "webauthn_challenges" VALUES(7,'82b66216a0c747f61c3a5c13c9b257140c839d565ab5e4c674a0dff35057cb7e',1,'registration',0,'2025-10-17T05:52:11.641Z','2025-10-17 05:47:11');
INSERT INTO "webauthn_challenges" VALUES(8,'45682a3ac73061477882c2157cba59650ba7f4ca34d0dbb7204c01072902af21',21,'registration',0,'2025-10-17T06:01:46.922Z','2025-10-17 05:56:46');
INSERT INTO "webauthn_challenges" VALUES(9,'1641c1349954a509a5b08ebce58d767b07e94483dd9665f302b701d04e762e1a',1,'registration',0,'2025-10-17T14:40:07.000Z','2025-10-17 14:35:07');
INSERT INTO "webauthn_challenges" VALUES(10,'e0e32165126366b43a316446e94b570aa1e664b71d9e59546c091cc8a282de03',1,'registration',0,'2025-10-17T14:47:28.209Z','2025-10-17 14:42:28');
INSERT INTO "webauthn_challenges" VALUES(11,'9a362b1243fed5444402a6f4a1606085511de4309c83eea746f8688e913c6c11',1,'registration',0,'2025-10-17T14:49:08.550Z','2025-10-17 14:44:08');
INSERT INTO "webauthn_challenges" VALUES(12,'e99ce5c0fea8665617b7dc0a17532ec1e091a1ef232ddc39031820b206882489',1,'registration',0,'2025-10-17T14:49:09.191Z','2025-10-17 14:44:09');
INSERT INTO "webauthn_challenges" VALUES(13,'91a7efb1a0f99345006355a4b13bdaa50fb6d4ac182fb1e21ab1a4997c382797',1,'registration',0,'2025-10-17T14:49:09.824Z','2025-10-17 14:44:09');
INSERT INTO "webauthn_challenges" VALUES(14,'8a4c4a190249349e04f1a0fa0dc12e32841d4c41c03d558b34ff64ad5bb2b2fa',22,'registration',0,'2025-10-21T15:38:30.186Z','2025-10-21 15:33:30');
INSERT INTO "webauthn_challenges" VALUES(15,'2b36163c9c07efed6471a5548d05f7744429b4864652ad4aa987702b1656cc1f',1,'registration',0,'2025-10-21T15:53:21.453Z','2025-10-21 15:48:21');
INSERT INTO "webauthn_challenges" VALUES(16,'c48eee1ef5affcc823598d8c7746edcddea4ff15d31dc6f569adc1dd31032272',1,'registration',0,'2025-10-21T15:54:51.206Z','2025-10-21 15:49:51');
INSERT INTO "webauthn_challenges" VALUES(17,'d3f029f711e93a60a50b2306f52c786ff5b9f23a29119456b06a16cb630e6207',1,'registration',0,'2025-10-21T15:54:58.366Z','2025-10-21 15:49:58');
INSERT INTO "webauthn_challenges" VALUES(18,'a733641856c698464579e8fd93ea8aa2d65ce024604d01530c6de318f7478f93',1,'registration',0,'2025-10-21T15:55:06.800Z','2025-10-21 15:50:06');
INSERT INTO "webauthn_challenges" VALUES(19,'22a77200b8d632caa471c2b2cba24655bcf5352e8309390b101785f4e949a09c',23,'registration',0,'2025-10-21T16:08:05.742Z','2025-10-21 16:03:05');
INSERT INTO "webauthn_challenges" VALUES(20,'a8c3d40e97a6486716483e4f64881076e1cc18ca288e71ab9a89bac363fe83de',23,'registration',0,'2025-10-21T16:08:10.075Z','2025-10-21 16:03:10');
INSERT INTO "webauthn_challenges" VALUES(21,'595d3d8ca127cef81cabe3c0fd78df51b4729ce12724cc8ef6759ca4e6590943',25,'registration',0,'2025-10-21T16:30:02.117Z','2025-10-21 16:25:02');
INSERT INTO "webauthn_challenges" VALUES(22,'672a4db86401abe2b8cb42c2c74683aa128af5776338753dcf91e1ebe8585a18',24,'registration',0,'2025-10-21T16:31:24.855Z','2025-10-21 16:26:24');
INSERT INTO "webauthn_challenges" VALUES(23,'8edacdd765a858af8c090b2ef636db8e8deb1245580c3885b4772821c88411d7',26,'registration',0,'2025-10-21T16:36:40.862Z','2025-10-21 16:31:40');
INSERT INTO "webauthn_challenges" VALUES(24,'c8ba477544491567c96df71f02e04d105a2e2203595610826a0d74c2c531c8cf',27,'registration',0,'2025-10-21T16:58:31.345Z','2025-10-21 16:53:31');
INSERT INTO "webauthn_challenges" VALUES(25,'3f659586ea65b083f5362dc17e3c8e52844c3ff5084878ef656d61a58380335b',27,'registration',0,'2025-10-21T16:58:44.823Z','2025-10-21 16:53:44');
INSERT INTO "webauthn_challenges" VALUES(26,'1d5ce85ae449a19dc04e43d1858f65f52d037a5baad9ded833524fd28b1003ac',28,'registration',0,'2025-10-21T17:03:16.222Z','2025-10-21 16:58:16');
INSERT INTO "webauthn_challenges" VALUES(27,'f625ed02f7c8c0bdde09e42ad514d6d4e5019c5b683b923d9ef80f0944cdb45d',29,'registration',0,'2025-10-21T17:03:39.299Z','2025-10-21 16:58:39');
INSERT INTO "webauthn_challenges" VALUES(28,'89c81a5b05a96e1c36ce7fb784aa7a807be6fcc18a0ce94bebc4b1468988a3f3',30,'registration',0,'2025-10-21T17:30:10.974Z','2025-10-21 17:25:10');
INSERT INTO "webauthn_challenges" VALUES(29,'cc4d4157a0a44554ae43c32da41ec66fb33a64f3a209ee2e303e3f1bafbc1b59',30,'registration',0,'2025-10-21T17:32:28.759Z','2025-10-21 17:27:28');
INSERT INTO "webauthn_challenges" VALUES(30,'50313c62cf324df69f068937a15132898531fc556355b5f9fbcfa79f0e1109b5',30,'registration',0,'2025-10-21T17:32:37.985Z','2025-10-21 17:27:37');
INSERT INTO "webauthn_challenges" VALUES(31,'57184aef0ac00b166462c4b0c7555360ff2f712d0e2975ac51d90b4836a503f6',30,'registration',0,'2025-10-21T17:32:44.746Z','2025-10-21 17:27:44');
INSERT INTO "webauthn_challenges" VALUES(32,'bb29b053eea69ada7d6fb194da58b0fab4a26f9b2c912a9bf43795472d898a1e',30,'registration',0,'2025-10-21T17:33:43.065Z','2025-10-21 17:28:43');
INSERT INTO "webauthn_challenges" VALUES(33,'c6a032640accf78d3efc8f73728673024e876ce1c75d1c228810af2ba14587be',30,'registration',0,'2025-10-21T17:33:48.110Z','2025-10-21 17:28:48');
INSERT INTO "webauthn_challenges" VALUES(34,'c8bfc656a288c6dbd7cb45307391038bff96db30852a70bca2599598c4de31b9',31,'registration',0,'2025-10-21T17:36:30.348Z','2025-10-21 17:31:30');
INSERT INTO "webauthn_challenges" VALUES(35,'05617a9c43ce069cdfe7bb8c9948543038ca6cf2a346323525a38b74a0adbb11',31,'registration',0,'2025-10-21T17:36:36.137Z','2025-10-21 17:31:36');
INSERT INTO "webauthn_challenges" VALUES(36,'7dfdb6e20ece65beb050e568956b7f44f0f4a8fca0bdcfbd9e722ad1c7de3b4c',31,'registration',0,'2025-10-21T17:42:52.622Z','2025-10-21 17:37:52');
INSERT INTO "webauthn_challenges" VALUES(37,'2be99b94c8999309630a2631413bdd02b3a11b03f574d1eb274d81df46db19b3',31,'registration',0,'2025-10-21T17:43:05.245Z','2025-10-21 17:38:05');
INSERT INTO "webauthn_challenges" VALUES(38,'e8bcb08b250290e0b70db8f45ae843571d677d836775bd9719de915d9d275e51',31,'registration',0,'2025-10-21T17:44:15.148Z','2025-10-21 17:39:15');
INSERT INTO "webauthn_challenges" VALUES(39,'5cf9a5ad80c6e1d887d34197c97096f37e0a211bef7cbc1b7e4f7a4741551bd5',31,'registration',0,'2025-10-21T17:48:39.756Z','2025-10-21 17:43:39');
INSERT INTO "webauthn_challenges" VALUES(40,'4ca2622b95de75d8f0ae996eb9c5d83e6932a9a2ad215c8ef2ad430885a0384a',32,'registration',0,'2025-10-21T17:52:18.028Z','2025-10-21 17:47:18');
CREATE TABLE webauthn_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    counter INTEGER DEFAULT 0,
    device_type TEXT DEFAULT 'unknown',
    authenticator_attachment TEXT DEFAULT 'unknown',
    last_used TEXT,
    use_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    data TEXT, last_used_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
INSERT INTO "user_sessions" VALUES(1,11,'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjExLCJ1c2VybmFtZSI6InByb2dyZXNzLXRlc3QiLCJleHAiOjE3NjA3NjUxODcsImlhdCI6MTc2MDY3ODc4N30.olnNcdLspyJERBJwsHs4kI-WsLEAhJkkLfkBneWaI1M','2025-10-18 05:26:27','2025-10-17T05:26:27.619Z',NULL,NULL);
CREATE TABLE question_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    user_id TEXT,
    selected_choice INTEGER,
    is_correct INTEGER NOT NULL,
    created_at TEXT NOT NULL
);
INSERT INTO "question_attempts" VALUES(1,2,NULL,0,0,'2025-10-19T14:16:50.795Z');
INSERT INTO "question_attempts" VALUES(2,1,NULL,1,1,'2025-10-19T14:16:50.795Z');
CREATE TABLE question_ratings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id INTEGER NOT NULL,
    user_id TEXT,
    rating INTEGER NOT NULL CHECK(rating IN (1, -1)),
    created_at TEXT NOT NULL,
    UNIQUE(question_id, user_id)
);
INSERT INTO "question_ratings" VALUES(1,1,NULL,1,'2025-10-19T14:17:11.318Z');
INSERT INTO "question_ratings" VALUES(2,'1760720273991_q5',NULL,1,'2025-10-19T14:20:40.417Z');
CREATE TABLE recovery_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    username TEXT NOT NULL,
    secret_answer_provided TEXT NOT NULL,
    contact_info TEXT,
    additional_info TEXT,
    requested_at TEXT DEFAULT (datetime('now')),
    ip_address TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    admin_note TEXT,
    processed_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE study_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id INTEGER,
    subject TEXT NOT NULL,
    difficulty_level TEXT NOT NULL,
    question_id TEXT,
    question_text TEXT,
    user_answer TEXT,
    correct_answer TEXT,
    is_correct INTEGER NOT NULL,
    time_spent_seconds INTEGER,
    answered_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES study_sessions(id) ON DELETE SET NULL
);
CREATE TABLE wrong_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    difficulty_level TEXT NOT NULL,
    question_id TEXT,
    question_text TEXT NOT NULL,
    user_answer TEXT,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    wrong_count INTEGER DEFAULT 1,
    last_wrong_at TEXT DEFAULT (datetime('now')),
    reviewed_at TEXT,
    mastered INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE study_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    difficulty_level TEXT NOT NULL,
    total_questions INTEGER DEFAULT 0,
    correct_questions INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    last_studied_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, subject, difficulty_level),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
ANALYZE sqlite_schema;
INSERT INTO "sqlite_stat1" VALUES('question_ratings','idx_question_ratings_question_id','2 1');
INSERT INTO "sqlite_stat1" VALUES('question_ratings','sqlite_autoindex_question_ratings_1','2 1 1');
INSERT INTO "sqlite_stat1" VALUES('question_attempts','idx_question_attempts_created_at','2 2');
INSERT INTO "sqlite_stat1" VALUES('question_attempts','idx_question_attempts_question_id','2 1');
INSERT INTO "sqlite_stat1" VALUES('user_sessions','idx_user_sessions_last_used','1 1');
INSERT INTO "sqlite_stat1" VALUES('user_sessions','idx_user_sessions_user_expires','1 1 1');
INSERT INTO "sqlite_stat1" VALUES('user_sessions','idx_user_sessions_session_token','1 1');
INSERT INTO "sqlite_stat1" VALUES('user_sessions','idx_user_sessions_expires','1 1');
INSERT INTO "sqlite_stat1" VALUES('user_sessions','idx_user_sessions_user','1 1');
INSERT INTO "sqlite_stat1" VALUES('user_sessions','idx_user_sessions_token','1 1');
INSERT INTO "sqlite_stat1" VALUES('user_sessions','sqlite_autoindex_user_sessions_1','1 1');
INSERT INTO "sqlite_stat1" VALUES('webauthn_challenges','idx_webauthn_challenges_challenge','40 1');
INSERT INTO "sqlite_stat1" VALUES('webauthn_challenges','idx_webauthn_challenges_expires','40 1');
INSERT INTO "sqlite_stat1" VALUES('webauthn_challenges','idx_webauthn_challenges_user','40 3 3 3');
INSERT INTO "sqlite_stat1" VALUES('_cf_KV','_cf_KV','2 1');
INSERT INTO "sqlite_stat1" VALUES('users','idx_users_inquiry_number','32 3');
INSERT INTO "sqlite_stat1" VALUES('users','idx_users_display_name','32 1');
INSERT INTO "sqlite_stat1" VALUES('users','idx_users_verification','32 32 32');
INSERT INTO "sqlite_stat1" VALUES('users','idx_users_passkey','32 32');
INSERT INTO "sqlite_stat1" VALUES('users','idx_users_username','32 1');
INSERT INTO "sqlite_stat1" VALUES('users','idx_users_email','32 1');
INSERT INTO "sqlite_stat1" VALUES('users','sqlite_autoindex_users_2','32 1');
INSERT INTO "sqlite_stat1" VALUES('users','sqlite_autoindex_users_1','32 1');
INSERT INTO "sqlite_stat1" VALUES('user_progress','idx_progress_user_subject','4 2 1');
INSERT INTO "sqlite_stat1" VALUES('user_progress','sqlite_autoindex_user_progress_1','4 2 1');
INSERT INTO "sqlite_stat1" VALUES('study_sessions','idx_study_sessions_user_completed','5 2 2');
INSERT INTO "sqlite_stat1" VALUES('study_sessions','idx_sessions_user_date','5 2 2');
INSERT INTO "sqlite_stat1" VALUES('note_questions','idx_note_questions_passage_order','91 23 10');
INSERT INTO "sqlite_stat1" VALUES('note_questions','idx_note_questions_passage_id','91 23');
INSERT INTO "sqlite_stat1" VALUES('note_questions','idx_note_questions_difficulty','91 23 19');
INSERT INTO "sqlite_stat1" VALUES('note_questions','idx_note_questions_subject','91 16 13');
INSERT INTO "sqlite_stat1" VALUES('note_questions','sqlite_autoindex_note_questions_1','91 1');
INSERT INTO "sqlite_stat1" VALUES('questions','idx_questions_difficulty','80 27 27');
INSERT INTO "sqlite_stat1" VALUES('questions','idx_questions_source','80 80 14');
INSERT INTO "sqlite_stat1" VALUES('questions','idx_questions_subject','80 14 14');
INSERT INTO "sqlite_stat1" VALUES('questions','sqlite_autoindex_questions_1','80 1');
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" VALUES('users',43);
INSERT INTO "sqlite_sequence" VALUES('study_sessions',5);
INSERT INTO "sqlite_sequence" VALUES('webauthn_challenges',40);
INSERT INTO "sqlite_sequence" VALUES('user_sessions',1);
INSERT INTO "sqlite_sequence" VALUES('question_attempts',2);
INSERT INTO "sqlite_sequence" VALUES('question_ratings',2);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_progress_user_subject ON user_progress(user_id, subject);
CREATE INDEX idx_sessions_user_date ON study_sessions(user_id, completed_at);
CREATE INDEX idx_questions_subject ON questions(subject, active);
CREATE INDEX idx_questions_source ON questions(source, subject);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level, active);
CREATE INDEX idx_users_passkey ON users(passkey_credential_id);
CREATE INDEX idx_users_verification ON users(verification_code, verification_expires);
CREATE INDEX idx_note_questions_subject ON note_questions(subject, is_deleted);
CREATE INDEX idx_note_questions_difficulty ON note_questions(difficulty_level, is_deleted);
CREATE INDEX idx_webauthn_challenges_user ON webauthn_challenges(user_id, operation_type, used);
CREATE INDEX idx_webauthn_challenges_expires ON webauthn_challenges(expires_at);
CREATE INDEX idx_webauthn_credentials_user ON webauthn_credentials(user_id);
CREATE INDEX idx_webauthn_credentials_id ON webauthn_credentials(credential_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_note_questions_passage_id ON note_questions(passage_id);
CREATE INDEX idx_note_questions_passage_order ON note_questions(passage_id, question_order);
CREATE INDEX idx_question_attempts_question_id ON question_attempts(question_id);
CREATE INDEX idx_question_attempts_created_at ON question_attempts(created_at);
CREATE INDEX idx_question_ratings_question_id ON question_ratings(question_id);
CREATE INDEX idx_recovery_requests_status ON recovery_requests(status);
CREATE INDEX idx_recovery_requests_username ON recovery_requests(username);
CREATE UNIQUE INDEX idx_users_display_name ON users(display_name);
CREATE UNIQUE INDEX idx_users_inquiry_number ON users(inquiry_number);
CREATE UNIQUE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user_expires ON user_sessions(user_id, expires_at);
CREATE INDEX idx_user_sessions_last_used ON user_sessions(last_used_at);
CREATE UNIQUE INDEX idx_webauthn_challenges_challenge ON webauthn_challenges(challenge);
CREATE UNIQUE INDEX idx_webauthn_credentials_credential_id ON webauthn_credentials(credential_id);
CREATE INDEX idx_webauthn_credentials_user_id ON webauthn_credentials(user_id);
CREATE INDEX idx_study_sessions_user_completed ON study_sessions(user_id, completed_at DESC);
CREATE INDEX idx_wrong_answers_user_subject ON wrong_answers(user_id, subject, difficulty_level);
CREATE INDEX idx_wrong_answers_last_wrong ON wrong_answers(last_wrong_at DESC);
CREATE INDEX idx_wrong_answers_mastered ON wrong_answers(mastered, user_id);
CREATE VIEW note_questions_view AS
SELECT
    id,
    subject,
    title,
    question_text,
    correct_answer,
    difficulty_level,
    choices,
    explanation,
    word,
    is_listening,
    tags,
    mode,
    media_urls
FROM questions
WHERE source = 'learning-notebook' AND active = 1 AND is_deleted = 0;
CREATE VIEW users_view AS
SELECT
    id,
    email,
    username,
    display_name,
    avatar_type,
    avatar_value,
    bio,
    goal,
    study_streak,
    total_study_time,
    email_verified,
    created_at,
    last_login,
    login_count,
    -- Passkey info (exclude sensitive data)
    CASE
        WHEN passkey_credential_id IS NOT NULL THEN 1
        ELSE 0
    END as has_passkey
FROM users;
CREATE VIEW user_progress_summary AS
SELECT
    u.id as user_id,
    u.username,
    u.display_name,
    COUNT(up.subject) as subjects_studied,
    SUM(up.total_questions) as total_questions_attempted,
    SUM(up.correct_answers) as total_correct_answers,
    CASE
        WHEN SUM(up.total_questions) > 0
        THEN ROUND((SUM(up.correct_answers) * 100.0) / SUM(up.total_questions), 2)
        ELSE 0
    END as overall_accuracy,
    MAX(up.current_streak) as best_subject_streak,
    MAX(up.updated_at) as last_study_date
FROM users u
LEFT JOIN user_progress up ON u.id = up.user_id
GROUP BY u.id, u.username, u.display_name;
CREATE VIEW subject_progress_detail AS
SELECT
    u.id as user_id,
    u.username,
    up.subject,
    up.total_questions,
    up.correct_answers,
    CASE
        WHEN up.total_questions > 0
        THEN ROUND((up.correct_answers * 100.0) / up.total_questions, 2)
        ELSE 0
    END as accuracy_percentage,
    up.current_streak,
    up.best_streak,
    up.updated_at as last_study_date,
    q_count.available_questions,
    CASE
        WHEN q_count.available_questions > 0
        THEN ROUND((up.total_questions * 100.0) / q_count.available_questions, 2)
        ELSE 0
    END as completion_percentage
FROM users u
JOIN user_progress up ON u.id = up.user_id
LEFT JOIN (
    SELECT subject, COUNT(*) as available_questions
    FROM questions
    WHERE source = 'learning-notebook' AND active = 1
    GROUP BY subject
) q_count ON up.subject = q_count.subject;
CREATE VIEW user_statistics AS
SELECT
    u.id as user_id,
    u.username,
    u.display_name,
    u.study_streak,
    u.total_study_time,
    COUNT(DISTINCT ss.subject) as sessions_count,
    COUNT(ss.id) as total_sessions,
    AVG(ss.accuracy) as avg_session_accuracy,
    MAX(ss.accuracy) as best_session_accuracy,
    SUM(ss.duration_minutes) as total_study_minutes,
    ROUND(SUM(ss.duration_minutes) / 60.0, 1) as total_study_hours
FROM users u
LEFT JOIN study_sessions ss ON u.id = ss.user_id
GROUP BY u.id, u.username, u.display_name, u.study_streak, u.total_study_time;
