-- Inscrever todos os leads da planilha no pipeline Society Manu & Grazi
-- Pipeline ID: 50217520-76e1-4356-bba8-7887c14cbf30
-- Etapa inicial (Entrada): 80adda49-c2d5-4cb2-849d-c11caf8a39c2

-- Buscar o lead mais antigo de cada email e inscrever (ignorar se já existe)
INSERT INTO lead_pipeline_entries (lead_id, pipeline_id, etapa_atual_id, status_inscricao, saude_etapa)
SELECT DISTINCT ON (l.email) 
  l.id as lead_id,
  '50217520-76e1-4356-bba8-7887c14cbf30'::uuid as pipeline_id,
  '80adda49-c2d5-4cb2-849d-c11caf8a39c2'::uuid as etapa_atual_id,
  'Ativo' as status_inscricao,
  'Verde' as saude_etapa
FROM leads l 
WHERE l.email IN (
  'cristiane21rocharamos@gmail.com', 'gabbyf_melo@hotmail.com', 'annasik100@gmail.com', 
  'alexandremontanszamarian@gmail.com', 'tatiana.apoliano@gmail.com', 'margareoliveira@hotmail.com',
  'davidorestesrichardvenancio@gmail.com', 'claudeteoliveiraterapeuta@gmail.com', 'paula.kimi@gmail.com',
  'nadiaflm@yahoo.com.br', 'hops.ho@gmail.com', 'elidocimel1234@hotmail.com', 'renatappl@gmail.com',
  'marleide01@hotmail.com', 'eduardodezembro872@gmail.com', 'octavio.martins@gmail.com',
  'luciano.azeredo32@gmail.com', 'lupimentta@gmail.com', 'gersonkawa@gmail.com',
  'vivianborges.psicopedagoga@gmail.com', 'rogeriopbe@hotmail.com', 'wladia_2005@yahoo.com.br',
  'sarah.spereira@icloud.com', 'thaismacedo.av@gmail.com', 'anajuliamontenegro@yahoo.com.br',
  'noeldeverdade61@gmail.com', 'efghilardi@gmail.com', 'nathaliaribeiroeducacao@gmail.com',
  'dominicaegoroff@gmail.com', 'danieladealmeida.nut2@gmail.com', 'simonesimon@gmail.com',
  'msfabi@hotmail.com', 'marialidomar70@gmail.com', 'adrianacristinax@yahoo.com.br',
  'gevanisilvaprof@gmail.com', 'marinambconsultoria@gmail.com', 'studiosetepilates@gmail.com',
  'mirliandias@gmail.com', 'adriana.parapsicologa@gmail.com', 'lucanzapl.pm@gmail.com',
  'welmank@gmail.com', 'j.matmec@hotmail.com', 'yasming.garrido@gmail.com', 'fesampaiov@icloud.com',
  'cris@oxigeniocco.com.br', 'renata_zeni@hotmail.com', 'andre.orto@hotmail.com',
  'arilenecosta.etiqueta@gmail.com', 'drajosilenem@gmail.com', 'mariiicarsi@gmail.com',
  'tatiane@tatianepinho.com.br', 'regianyteixeiracarlos@gmail.com', 'maryvilhalba@gmail.com',
  'dilsaodocavaco@hotmail.com', 'decolaconsultorio@gmail.com', 'estetica.berta.oliver@gmail.com',
  'abimadoceu@gmail.com', 'rubi.corretora@hotmail.com', 'jomenndes@gmail.com',
  'potencializapsi@gmail.com', 'juliane_mesquita@yahoo.com.br', 'euda.ec@gmail.com',
  'cidacarterapeuta@gmail.com', 'rociogameromc@gmail.com', 'conexaomarcialbrasil@gmail.com',
  'agdapb18@gmail.com', 'karinatrampuch@hotmail.com'
)
-- Pegar o lead mais antigo de cada email
ORDER BY l.email, l.created_at ASC
-- Não inserir se já existe uma inscrição ativa para este lead neste pipeline
ON CONFLICT DO NOTHING;