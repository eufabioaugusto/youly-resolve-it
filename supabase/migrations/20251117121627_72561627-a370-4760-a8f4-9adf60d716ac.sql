-- Deletar ordem de serviço duplicada (a mais antiga que não está referenciada pelo job)
DELETE FROM ordem_servico 
WHERE id = '1e338838-a628-4769-8596-c877507a9998';