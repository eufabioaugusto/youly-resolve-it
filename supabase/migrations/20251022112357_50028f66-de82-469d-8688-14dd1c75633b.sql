-- Atualizar ordens de serviço existentes com as datas corretas dos jobs
DO $$
DECLARE
  os_record RECORD;
  job_record RECORD;
  data_opcao JSONB;
BEGIN
  -- Para cada ordem de serviço sem data
  FOR os_record IN 
    SELECT id, job_id 
    FROM ordem_servico 
    WHERE data_hora_agendamento IS NULL
  LOOP
    -- Buscar job relacionado
    SELECT data_opcoes INTO job_record
    FROM jobs 
    WHERE id = os_record.job_id;
    
    -- Se o job tem opções de data
    IF job_record.data_opcoes IS NOT NULL THEN
      -- Buscar a primeira opção marcada como selecionada
      FOR data_opcao IN 
        SELECT * FROM jsonb_array_elements(job_record.data_opcoes)
      LOOP
        IF (data_opcao->>'selecionado')::boolean = true THEN
          -- Atualizar a OS com a data encontrada
          UPDATE ordem_servico 
          SET 
            data_hora_agendamento = (data_opcao->>'data')::timestamp,
            periodo_agendamento = data_opcao->>'periodo'
          WHERE id = os_record.id;
          
          RAISE NOTICE 'OS % atualizada com data %', os_record.id, data_opcao->>'data';
          EXIT; -- Sair do loop após encontrar a primeira data selecionada
        END IF;
      END LOOP;
    END IF;
  END LOOP;
END $$;