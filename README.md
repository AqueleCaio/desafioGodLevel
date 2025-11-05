## Desafio Nola God Level

Este projeto foi desenvolvido como parte do processo seletivo **Nola - God Level**, com o objetivo de demonstrar habilidades em **desenvolvimento full stack**, **integração de dados externos**, e **resolução de problemas**.

---

## Descrição do Projeto

O sistema tem como finalidade consultar, agregar e visualizar dados, permitindo ao usuário:

* Selecionar diferentes tabelas e colunas de um banco de dados PostgreSQL.
* Aplicar filtros, agregações (soma, média, máximo, mínimo etc.) e condições `HAVING`.
* Gerar relatórios dinâmicos.
* Visualizar os resultados em tabelas e gráficos interativos `src/components/chart.jsx`.
* Traduzir dinamicamente os nomes das tabelas e colunas para uma interface mais intuitiva.

O projeto foi desenvolvido com uma **arquitetura separada** entre *frontend* e *backend*, permitindo fácil manutenção e escalabilidade.

---

## Tecnologias Utilizadas

### Backend

* **Node.js**
* **Express**
* **Prisma ORM**
* **PostgreSQL**
* **Axios** 
* **Cors** e **Dotenv**

### Frontend

* **React.js**
* **Chart.js**
* **CSS Modules**
* **React Icons**

---

## Estrutura do Projeto

O projeto está dividido em duas pastas principais:

```
/App
  ├── public/
  │   └── assets/
  ├── src/
  │   ├── components/
  │   │   ├── filter/
  │   │   │   ├── aggregation.jsx
  │   │   │   ├── columns.jsx
  │   │   │   ├── filters.jsx
  │   │   │   ├── orderBy.jsx
  │   │   │   ├── tables.jsx
  │   │   │   ├── typeJoin.jsx
  │   │   │   └── filterMain.jsx
  │   │   ├── chart.jsx
  │   │   ├── code.jsx
  │   │   ├── modalChart.jsx
  │   │   └── table.jsx
  │   ├── context/
  │   │   └── queryContext.jsx
  │   ├── services/
  │   │   └── frontController.js
  │   ├── styles/
  │   │   ├── Chart.css
  │   │   ├── code.css
  │   │   ├── Filters.css
  │   │   ├── ModalChart.css
  │   │   └── Table.css
  │   ├── App.css
  │   ├── App.jsx
  │   ├── index.css
  │   └── main.jsx

/back
  ├── DAO/ (Direct Acess Object)
       └──BDmain.js
  ├── prisma/
       └── schema.prisma
  ├── .env
  ├── backController.js
  ├── generate_data.py
  └── index.js

```

A documentação detalhada da estrutura pode ser consultada em [Documentação](Documentação.pdf).

---

## Configuração do Ambiente

1. **Clone o repositório**

   ```bash
   git clone https://github.com/seu-usuario/desafio-nola-godlevel.git
   cd desafio-nola-godlevel
   ```

2. **Instale as dependências do backend**

   ```bash
   cd back
   npm install
   ```

3. **Configure o arquivo `.env`**

   ```bash
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/seu_banco"
   ```

4. **Execute as migrações e o seed**

   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db push
   ```

5. **Alimente o banco**
   
   Depois de ter criado o banco, agora será necessário alimentá-lo com os dados utilizando o `back/generate_data.py`
   ```bash
   python generate_data.py
   ```

7. **Inicie o servidor**

   ```bash
   node index.js
   ```

8. **Inicie o frontend**

   ```bash
   cd ../App
   npm install
   npm run dev
   ```

9. Acesse o sistema em:
   [http://localhost:5173](http://localhost:5173)

---

## Contribuindo

* [Como o projeto está estruturado?](./STRUCTURE.md)

### PT-BR

1. Crie um fork!
2. Crie sua feature branch:

   ```bash
   git checkout -b my-new-feature
   ```
3. Adicione os arquivos modificados:

   ```bash
   git add .
   ```
4. Faça um commit com suas alterações:

   ```bash
   git commit -m "Add some feature"
   ```
5. Faça um push da sua branch:

   ```bash
   git push origin my-new-feature
   ```
6. Envie um Pull Request para este repositório.

* Adicione um título e uma descrição que deixem clara sua sugestão.

**Depois que seu pull request for mergeado**

> Depois que seu pull request for mergeado, você pode apagar sua branch.

