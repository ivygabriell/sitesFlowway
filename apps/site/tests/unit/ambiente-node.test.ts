// @vitest-environment node
import { expect, it } from 'vitest';

it('le multipart com File nativo no ambiente dos handlers de servidor', async () => {
  const corpo = new FormData();
  corpo.set('arquivo', new File(['conteudo de teste'], 'exemplo.txt', { type: 'text/plain' }));
  const requisicao = new Request('https://floway.example/api/contato', { method: 'POST', body: corpo });
  const arquivo = (await requisicao.formData()).get('arquivo');
  expect(arquivo).toBeInstanceOf(File);
  expect((arquivo as File).name).toBe('exemplo.txt');
  expect(await (arquivo as File).text()).toBe('conteudo de teste');
});
