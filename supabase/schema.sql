-- ============================================================
-- QUIZ NOIR — Twitch — Schéma Supabase
-- À exécuter dans l'éditeur SQL de Supabase (Dashboard > SQL Editor)
-- ============================================================

-- ---------- Table : questions ----------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  choice_a text not null,
  choice_b text not null,
  choice_c text not null,
  choice_d text not null,
  correct_answer char(1) not null check (correct_answer in ('A', 'B', 'C', 'D')),
  difficulty_level text not null default 'facile'
    check (difficulty_level in ('facile', 'moyen', 'difficile')),
  is_used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_questions_is_used on public.questions (is_used);
create index if not exists idx_questions_difficulty on public.questions (difficulty_level);

-- ---------- Table : game_state (état temps réel du live) ----------
-- Une seule ligne (id = 1) que le dashboard modérateur pilote
-- et que l'overlay du live écoute en temps réel.
create table if not exists public.game_state (
  id int primary key check (id = 1),
  status text not null default 'idle'
    check (status in ('idle', 'question_live', 'answer_revealed')),
  current_question_id uuid references public.questions (id) on delete set null,
  revealed_choice char(1) check (revealed_choice in ('A', 'B', 'C', 'D')),
  hidden_choices text[] not null default '{}',
  joker_used boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.game_state (id) values (1)
on conflict (id) do nothing;

-- ---------- Temps réel ----------
-- Active la réplication temps réel pour l'overlay du live.
alter publication supabase_realtime add table public.game_state;

-- ---------- Sécurité (Row Level Security) ----------
alter table public.questions enable row level security;
alter table public.game_state enable row level security;

-- Lecture publique : l'overlay du live (sans login) doit lire l'état et les questions.
create policy "Lecture publique des questions"
  on public.questions for select
  to anon, authenticated
  using (true);

create policy "Lecture publique de l'état du jeu"
  on public.game_state for select
  to anon, authenticated
  using (true);

-- Écriture : le dashboard modérateur utilise la clé anon.
-- ⚠️ Pour un stream public, remplacez `anon` par `authenticated`
-- et connectez le modérateur via Supabase Auth (magic link / OAuth).
create policy "Le modérateur peut piocher et marquer les questions"
  on public.questions for update
  to anon, authenticated
  using (true)
  with check (true);

create policy "Le modérateur pilote l'état du jeu"
  on public.game_state for update
  to anon, authenticated
  using (true)
  with check (true);

-- ---------- Questions de démarrage ----------
insert into public.questions
  (question_text, choice_a, choice_b, choice_c, choice_d, correct_answer, difficulty_level)
values
  ('Quelle plateforme est spécialisée dans le streaming de jeux vidéo en direct ?',
   'Netflix', 'Twitch', 'Spotify', 'Deezer', 'B', 'facile'),
  ('Combien de joueurs composent une équipe standard dans un match de football ?',
   '9', '10', '11', '12', 'C', 'facile'),
  ('Quelle est la capitale du Japon ?',
   'Kyoto', 'Osaka', 'Pékin', 'Tokyo', 'D', 'facile'),
  ('Quel langage est principalement exécuté dans le navigateur web ?',
   'Python', 'JavaScript', 'Rust', 'SQL', 'B', 'facile'),
  ('En quelle année l''homme a-t-il marché sur la Lune pour la première fois ?',
   '1965', '1969', '1972', '1975', 'B', 'moyen'),
  ('Quel protocole sécurise les échanges sur le web (cadenas du navigateur) ?',
   'FTP', 'SMTP', 'HTTPS', 'SSH', 'C', 'moyen'),
  ('Quel studio a créé le jeu « The Legend of Zelda » ?',
   'Sony', 'Microsoft', 'Nintendo', 'Ubisoft', 'C', 'moyen'),
  ('Quelle est la plus grande planète du système solaire ?',
   'Saturne', 'Neptune', 'Jupiter', 'Uranus', 'C', 'moyen'),
  ('Quelle structure de données fonctionne en LIFO (dernier entré, premier sorti) ?',
   'File', 'Pile', 'Arbre', 'Graphe', 'B', 'difficile'),
  ('Quel physicien a formulé la relativité restreinte en 1905 ?',
   'Newton', 'Bohr', 'Galilée', 'Einstein', 'D', 'difficile'),
  ('En SQL, quelle clause permet de filtrer des groupes après un GROUP BY ?',
   'WHERE', 'HAVING', 'ORDER BY', 'LIMIT', 'B', 'difficile'),
  ('Quel port est utilisé par défaut pour HTTPS ?',
   '80', '21', '443', '8080', 'C', 'difficile');
